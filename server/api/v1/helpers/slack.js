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
        "text": "• Name: `" + user.first_name + " " + user.last_name + "` \n• Phone: `" + concatenateCustomerNumbers(user.mobile_number_one, user.mobile_number_two) + "`\n• Email: `" + user.email + "`"
      }
    }
  ])
}

export const sendUnApprovedDispatcherNotification = function sendUnApprovedDispatcherNotification(user) {
  sendSlackNotification(process.env.SLACK_ONBOARDING_CHANNEL_HOOK, 'New Dispatcher', [
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

export const sendNewPackageNotification = function sendNewPackageNotification(package_detail, user, other) {
  sendSlackNotification(process.env.SLACK_DISPATCH_CHANNEL_HOOK, '', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Event: `New Dispatch Request` :package:"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Name: `" + user.first_name + " " + user.last_name + "` \n• Phone: `" + concatenateCustomerNumbers(user.mobile_number_one, user.mobile_number_two) + "`\n• Email: `" + user.email + "`"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Package Id: `" + package_detail.package_id + "` \n• Description: `" + package_detail.description + "`\n• Weight: `" + package_detail.weight + "`\n• Value: `" + package_detail.value + "`\n• Price: `" + package_detail.delivery_price + "`\n• Delivery Key: `" + package_detail.delivery_key + "`"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• From: `" + other.from_town + ", " + other.from_state + "` \n• To: `" + other.to_town + ", " + other.to_state + "`"
      }
    }
  ])
}

export const sendNewInterestInPackageNotification = function sendNewInterestInPackageNotification(packageId, dispatcher, customer) {
  sendSlackNotification(process.env.SLACK_DISPATCH_CHANNEL_HOOK, '', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Event: `Interest in Package` :raised_hand:\nPackage Id: `" + packageId + "`"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Dispatcher Name: `" + dispatcher.first_name + " " + dispatcher.last_name + "` \n• Dispatcher Phone: `" + dispatcher.mobile_number + "`\n• Dispatcher Email: `" + dispatcher.email + "`"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Customer Name: `" + customer.first_name + " " + customer.last_name + "` \n• Customer Phone: `" + concatenateCustomerNumbers(customer.mobile_number_one, customer.mobile_number_two) + "`\n• Customer Email: `" + customer.email + "`"
      }
    },
  ])
}

export const sendInterestApprovedOrDeclinedNotification = function sendInterestApprovedOrDeclinedNotification(isApproved, packageId, dispatcher) {
  let message;
  if(isApproved)
    message = "Event: `Dispatcher Interest Approved` :green_heart:\nPackage Id: `" + packageId + "`"
  else
    message = "Event: `Dispatcher Interest Declined` :broken_heart:\nPackage Id: `" + packageId + "`"
  sendSlackNotification(process.env.SLACK_DISPATCH_CHANNEL_HOOK, '', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": message
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Dispatcher Name: `" + dispatcher.first_name + " " + dispatcher.last_name + "` \n• Dispatcher Phone: `" + dispatcher.mobile_number + "`\n• Dispatcher Email: `" + dispatcher.email + "`"
      }
    }
  ])
}

export const sendDispatcherDeclinedPickupNotification = function sendDispatcherDeclinedPickupNotification(packageId, reason, dispatcher) {
  sendSlackNotification(process.env.SLACK_DISPATCH_CHANNEL_HOOK, '', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Event: `Dispatcher Declined Pickup for Package` :x:\nPackage Id: `" + packageId + "`\nReason for Decline: \n```" + reason + "```"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Dispatcher Name: `" + dispatcher.first_name + " " + dispatcher.last_name + "` \n• Dispatcher Phone: `" + dispatcher.mobile_number + "`\n• Dispatcher Email: `" + dispatcher.email + "`"
      }
    }
  ])
}

export const sendDispatcherStartsDispatchNotification = function sendDispatcherStartsDispatchNotification(packageId, dispatcher, other) {
  sendSlackNotification(process.env.SLACK_DISPATCH_CHANNEL_HOOK, '', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Event: `Dispatch Started` :truck:\nPackage Id: `" + packageId + "`"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• From: `" + other.from_town + ", " + other.from_state + "` \n• To: `" + other.to_town + ", " + other.to_state + "`"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Dispatcher Name: `" + dispatcher.first_name + " " + dispatcher.last_name + "` \n• Dispatcher Phone: `" + dispatcher.mobile_number + "`\n• Dispatcher Email: `" + dispatcher.email + "`"
      }
    }
  ])
}

export const sendPackageDeliveredNotification = function sendPackageDeliveredNotification(packageId, dispatcher, customer) {
  sendSlackNotification(process.env.SLACK_DISPATCH_CHANNEL_HOOK, '', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Event: `Package Delivered` :tada:\nPackage Id: `" + packageId + "`"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Dispatcher Name: `" + dispatcher.first_name + " " + dispatcher.last_name + "` \n• Dispatcher Phone: `" + dispatcher.mobile_number + "`\n• Dispatcher Email: `" + dispatcher.email + "`"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Customer Name: `" + customer.first_name + " " + customer.last_name + "` \n• Customer Phone: `" + concatenateCustomerNumbers(customer.mobile_number_one, customer.mobile_number_two) + "`\n• Customer Email: `" + customer.email + "`"
      }
    },
  ])
}

function concatenateCustomerNumbers(phone1, phone2){
  if(!phone2)
    return phone1
  else
    return `${phone1}, ${phone2}`
}

