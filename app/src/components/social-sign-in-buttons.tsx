import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';

const PROVIDERS = [
  { id: 'google', label: 'Continue with Google' },
  { id: 'spotify', label: 'Continue with Spotify' },
] as const;

type SocialSignInButtonsProps = {
  onError: (message: string) => void;
};

export function SocialSignInButtons({ onError }: SocialSignInButtonsProps) {
  const handleSocialLogin = async (provider: (typeof PROVIDERS)[number]['id']) => {
    const { error: signInError } = await authClient.signIn.social({
      provider,
      callbackURL: '/',
    });
    if (signInError) {
      onError(signInError.message ?? `Failed to sign in with ${provider}`);
    }
  };

  return (
    <>
      {PROVIDERS.map(({ id, label }) => (
        <Button key={id} variant="secondary" size="lg" onPress={() => handleSocialLogin(id)}>
          <Text>{label}</Text>
        </Button>
      ))}
    </>
  );
}
