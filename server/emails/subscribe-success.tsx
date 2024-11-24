import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Tailwind,
  Text,
  render,
} from '@react-email/components';

import { Email } from '@/types/email';

const SubscribeSucessEmail = () => {
  const previewText = 'Subscription Successful';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="rounded my-0 mx-auto p-[20px] w-[560px]">
            <Text className="text-[#484848] text-[24px] font-normal my-[30px] mx-0">
              Thank you for subscribing to Our Product!
            </Text>

            {/* <Section className="mt-[36px] mb-[28px]">
              <Button
                className="bg-[#B0E64C] rounded-full text-white text-[12px] font-semibold no-underline text-center px-4 py-3"
                href={loginLink}
              >
                Login to Captioner
              </Button>
            </Section> */}

            <Text className="text-[#3c4149] text-[15px] leading-[24px]">
              We are glad to have you on board. If there is anything you need,
              please don't hesitate to reach out to us.
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

export default SubscribeSucessEmail;

export async function renderSubscribeSuccessEmail(): Promise<Email> {
  return {
    subject: 'Thank you for subscribing to Our Product!',
    html: await render(<SubscribeSucessEmail />),
  };
}
