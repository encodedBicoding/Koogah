/* eslint-disable camelcase */
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();


export default function sendSlackNotification(hookUrl, text, blocks=[]) {
  let preBlocks = []
  if(process.env.NODE_ENV === 'production') {
    preBlocks.push({type: 'section', text: { type: 'mrkdwn', text: `<!channel>`, }, })
  }
  if(process.env.NODE_ENV !== 'production') {
    preBlocks.push({
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": ":hammer_and_wrench: *Development* `Do not take this message serious`"
        }
      ]
    })
  }


  let message = {}
  if(blocks.length > 0) {
    if(text)
      preBlocks.push({ type: 'section', text: { type: 'plain_text', text } })
    message = { blocks: preBlocks.concat(blocks) }
  } else {
    message = { 
      blocks: preBlocks.concat({ type: 'section', text: { type: 'plain_text', text } })
    }
  }
  return fetch(
    hookUrl,
    {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(message)
    }
  )
}

export const sendNewCustomerNotification = function sendNewCustomerNotification(user) {
  sendSlackNotification(process.env.SLACK_ONBOARDING_CHANNEL_HOOK, '', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Type: `Customer`\nAction: `Registration Successful`"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Name: `" + user.first_name + " " + user.last_name + "` \n• Phone: `" + user.mobile_number_one + ", " + user.mobile_number_two + "`\n• Email: `" + user.email + "`"
      }
    }
  ])
}

export const sendUnApprovedDispatcherNotification = function sendUnApprovedDispatcherNotification(user) {
  sendSlackNotification(process.env.SLACK_ONBOARDING_CHANNEL_HOOK, 'New Dispather', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Type: `Dispatcher`\nAction: `Awaiting Approval`"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Name: `" + user.first_name + " " + user.last_name + "` \n• Phone: `" + user.mobile_number + "`\n• Email: `" + user.user_email + "`"
      }
    }
  ])
}

