import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';

const PROVIDERS = [
  { id: 'google', name: 'Google' },
  { id: 'spotify', name: 'Spotify' },
] as const;

type SocialSignInButtonsProps = {
  onError: (message: string) => void;
};

export function SocialSignInButtons({ onError }: SocialSignInButtonsProps) {
  const handleSocialLogin = async ({ id, name }: (typeof PROVIDERS)[number]) => {
    const { error: signInError } = await authClient.signIn.social({
      provider: id,
      callbackURL: '/',
      // Both relative, so the Expo plugin turns them into deep links. Without the error
      // one a failed round trip strands the user on the server's error page.
      errorCallbackURL: '/login',
    });
    if (signInError) {
      onError(signInError.message ?? `Could not sign in with ${name}.`);
      return;
    }

    // The plugin consumes the browser result itself and returns silently whenever the
    // redirect carries no session cookie, so a refused sign-in — and a dismissed browser —
    // both resolve as a success. Still having no session is the only signal left, and it
    // cannot tell those apart, hence the neutral wording.
    const { data: session } = await authClient.getSession();
    if (!session) onError(`Signing in with ${name} didn't finish.`);
  };

  return (
    <>
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          variant="secondary"
          size="lg"
          onPress={() => handleSocialLogin(provider)}
        >
          <Text>Continue with {provider.name}</Text>
        </Button>
      ))}
    </>
  );
}
