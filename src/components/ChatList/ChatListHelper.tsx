import ChatList from '@/components/ChatList/index.vue'

export default function getChatListOf(channel: number) {
  return <ChatList channel={channel} />
}


export function getPlaceholder(channel: number) {
  return <div>You haven't selected any channel. This is a PLACEHOLDER for channel {channel}</div>
}