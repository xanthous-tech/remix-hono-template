import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
  render,
} from '@react-email/components';
import { z } from 'zod';

import { Email } from '@/types/email';

const magicLinkEmailSchema = z.object({
  link: z.string(),
});

type MagicLinkEmailProps = z.infer<typeof magicLinkEmailSchema>;

export const MagicLinkEmail = ({ link }: MagicLinkEmailProps) => {
  const previewText = 'Login with Magic Link';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="rounded my-0 mx-auto p-[20px] w-[560px]">
            <Text className="text-[#484848] text-[24px] font-normal my-[30px] mx-0">
              The Login Magic Link for Our Product
            </Text>

            <Section className="mt-[36px] mb-[28px]">
              <Button
                className="bg-[#484848] rounded-full text-white text-[12px] font-semibold no-underline text-center px-4 py-3"
                href={link}
              >
                Login to Our Product
              </Button>
            </Section>

            <Text className="text-[#3c4149] text-[15px] leading-[24px]">
              This link and code will only be valid for the next 5 minutes.
            </Text>

            <Hr className="my-[26px] mx-0 w-full" />

            <Text className="text-[#ababab] text-[12px] leading-[24px]">
              Our Product
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default MagicLinkEmail;

export async function renderMagicLinkEmail(
  input: MagicLinkEmailProps,
): Promise<Email> {
  const props = magicLinkEmailSchema.parse(input);

  return {
    subject: 'The Login Magic Link for Our Product',
    html: await render(<MagicLinkEmail {...props} />),
  };
}
