import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledInput } from '@/components/controlled-input';
import { ResendCodeLink, useResendCooldown } from '@/components/resend-code-link';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import {
  newPasswordSchema,
  requestResetSchema,
  verifyCodeSchema,
  type NewPasswordValues,
  type RequestResetValues,
  type VerifyCodeValues,
} from '@/lib/auth-schemas';

type Step =
  | { name: 'request' }
  | { name: 'code'; email: string; notice?: string }
  | { name: 'password'; email: string; otp: string };

/** Returns the message to show, or `undefined` once the code is on its way. */
type SendCode = (email: string) => Promise<string | undefined>;

const CODE_ERRORS: Record<string, string> = {
  OTP_EXPIRED: 'That code has expired. Send a new one.',
  TOO_MANY_ATTEMPTS: 'Too many tries. Send a new code.',
};

// Everything else collapses to one message: the endpoint distinguishes a wrong code from
// an address with no account, and repeating that here would answer a question the request
// step is careful not to.
function codeErrorMessage(code?: string) {
  return (code && CODE_ERRORS[code]) ?? "That code didn't work.";
}

/**
 * Request a code, confirm it, then set the password — three steps rather than one, so a
 * wrong code is caught before anyone types a password. `checkVerificationOtp` leaves the
 * code usable, which is what lets the same one carry into the reset.
 */
export function PasswordResetFlow({
  email,
  emailEditable = true,
  onDone,
}: {
  email?: string;
  /** False where the address comes from the session and resetting another makes no sense. */
  emailEditable?: boolean;
  onDone: () => void;
}) {
  const [step, setStep] = useState<Step>({ name: 'request' });
  const { secondsLeft, arm } = useResendCooldown();

  // Advances whatever the server says. The endpoint answers the same for an address with
  // no account, and branching on it here would leak which addresses have one.
  const sendCode: SendCode = async (address) => {
    const { error } = await authClient.emailOtp.requestPasswordReset({
      email: address,
    });
    if (error) return error.message ?? 'Could not send a code just now.';
    arm();
    return undefined;
  };

  return (
    <View className="gap-4">
      {step.name === 'request' && (
        <RequestStep
          email={email}
          editable={emailEditable}
          sendCode={sendCode}
          onSent={(address) => setStep({ name: 'code', email: address })}
        />
      )}

      {step.name === 'code' && (
        <CodeStep
          email={step.email}
          notice={step.notice}
          secondsLeft={secondsLeft}
          sendCode={sendCode}
          onVerified={(otp) =>
            setStep({ name: 'password', email: step.email, otp })
          }
        />
      )}

      {step.name === 'password' && (
        <PasswordStep
          email={step.email}
          otp={step.otp}
          onDone={onDone}
          onCodeLapsed={(notice) =>
            setStep({ name: 'code', email: step.email, notice })
          }
        />
      )}
    </View>
  );
}

function RequestStep({
  email,
  editable,
  sendCode,
  onSent,
}: {
  email?: string;
  editable: boolean;
  sendCode: SendCode;
  onSent: (email: string) => void;
}) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: email ?? '' },
  });

  const onSubmit = async ({ email: address }: RequestResetValues) => {
    const message = await sendCode(address);
    if (message) {
      setError('root', { message });
      return;
    }
    onSent(address);
  };

  return (
    <>
      <StepHeading>Reset your password.</StepHeading>
      <Text className="text-ink-muted font-body text-body-sm">
        {editable
          ? "We'll email you a six-digit code to set a new one with."
          : `We'll email a six-digit code to ${email}.`}
      </Text>

      {editable && (
        <ControlledInput
          control={control}
          name="email"
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onSubmitEditing={handleSubmit(onSubmit)}
        />
      )}

      <RootError message={errors.root?.message} />
      <Button size="lg" disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
        <Text>Email me a code</Text>
      </Button>
    </>
  );
}

function CodeStep({
  email,
  notice,
  secondsLeft,
  sendCode,
  onVerified,
}: {
  email: string;
  notice?: string;
  secondsLeft: number;
  sendCode: SendCode;
  onVerified: (otp: string) => void;
}) {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { otp: '' },
  });

  const onSubmit = async ({ otp }: VerifyCodeValues) => {
    const { error } = await authClient.emailOtp.checkVerificationOtp({
      email,
      otp,
      type: 'forget-password',
    });
    if (error) {
      setError('root', { message: codeErrorMessage(error.code) });
      return;
    }
    onVerified(otp);
  };

  const resend = async () => {
    clearErrors('root');
    const message = await sendCode(email);
    if (message) setError('root', { message });
  };

  return (
    <>
      <StepHeading>Check your email.</StepHeading>
      <Text className="text-ink-muted font-body text-body-sm">
        We sent a six-digit code to {email}. It expires in five minutes.
      </Text>

      <ControlledInput
        control={control}
        name="otp"
        placeholder="6-digit code"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        onSubmitEditing={handleSubmit(onSubmit)}
      />

      <RootError message={errors.root?.message ?? notice} />
      <Button size="lg" disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
        <Text>Confirm code</Text>
      </Button>
      <ResendCodeLink
        secondsLeft={secondsLeft}
        disabled={isSubmitting}
        onPress={resend}
      />
    </>
  );
}

function PasswordStep({
  email,
  otp,
  onDone,
  onCodeLapsed,
}: {
  email: string;
  otp: string;
  onDone: () => void;
  onCodeLapsed: (notice: string) => void;
}) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '' },
  });

  // A successful reset also marks the address verified: receiving the code proved it.
  const onSubmit = async ({ password }: NewPasswordValues) => {
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });
    if (error) {
      // The five minutes can lapse between confirming the code and typing a password,
      // and this form has no way forward once they have.
      if (error.code && error.code in CODE_ERRORS) {
        onCodeLapsed(codeErrorMessage(error.code));
        return;
      }
      setError('root', {
        message: error.message ?? 'Could not set that password.',
      });
      return;
    }
    onDone();
  };

  return (
    <>
      <StepHeading>Choose a new one.</StepHeading>
      <Text className="text-ink-muted font-body text-body-sm">
        At least eight characters.
      </Text>

      <ControlledInput
        control={control}
        name="password"
        placeholder="New password"
        autoComplete="new-password"
        secureTextEntry
        onSubmitEditing={handleSubmit(onSubmit)}
      />

      <RootError message={errors.root?.message} />
      <Button size="lg" disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
        <Text>Set new password</Text>
      </Button>
    </>
  );
}

function StepHeading({ children }: { children: string }) {
  return (
    <Text className="text-foreground font-display text-display-md tracking-tight mb-2">
      {children}
    </Text>
  );
}

function RootError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text className="text-destructive font-body text-body-sm">{message}</Text>
  );
}
