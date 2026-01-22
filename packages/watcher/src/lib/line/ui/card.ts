import type { messagingApi } from '@line/bot-sdk'

export function card({
  alt,
  title,
  description,
  imageUrl,
  actions,
  customFooter,
}: {
  alt?: string
  title: string
  description: string
  imageUrl: string
  actions?: { label: string; message: string }[]
  customFooter?: messagingApi.FlexComponent[]
}): messagingApi.Message {
  return {
    type: 'flex',
    altText: alt ?? 'Flex Message',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: imageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: title,
            weight: 'bold',
            size: 'xl',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: description,
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          ...(actions ?? []).map(
            ({ label, message }) =>
              ({
                type: 'button',
                style: 'link',
                height: 'sm',
                action: {
                  type: 'message',
                  label,
                  text: message,
                },
              }) as const,
          ),
          ...(customFooter ?? []),
        ],
        flex: 0,
      },
    },
  }
}
