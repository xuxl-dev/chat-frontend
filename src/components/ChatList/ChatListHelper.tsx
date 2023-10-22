import ChatList from '@/components/ChatList/index.vue'

export function formatChannelName(channel: number, isGroup: boolean) {
  if (isGroup) {
    return `group:${channel}`
  }
  else {
    return `user:${channel}`
  }
}

export default function getChatListOf(channel: number, isGroup: boolean) {
  return <ChatList channel={channel} isGroup={isGroup} key={formatChannelName(channel, isGroup)} />
}

export function getPlaceholder(channel: number) {
  return <div>You haven't selected any channel. This is a PLACEHOLDER for channel {channel}</div>
}