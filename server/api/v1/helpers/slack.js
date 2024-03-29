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


export const sendEmergencyContactAddressVerification = function sendEmergencyContactAddressVerification(data) {
  const {
    applicant,
    neighbor,
    status
  } = data;
  sendSlackNotification(process.env.SLACK_ADDRESS_VERIFICATION_CHANNEL_HOOK, '', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Applicant"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "plain_text",
          "text": `Firstname: ${applicant.firstname}\nLastname: ${applicant.lastname}\nPhone: ${applicant.phone}\nIdentification Type: ${applicant.idType}\nIdentification Number: ${applicant.idNumber}\nMiddlename: ${applicant.middlename}\nGender: ${applicant.gender}Birthdate: ${applicant.birthdate}`,
          "emoji": true
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "plain_text",
        "text": `Created At: ${data.createdAt}\nCompleted At: ${data.completedAt}\nLattitude: ${data.lattitude}\nLongitude: ${data.longitude}`,
        "emoji": true
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "plain_text",
        "text": `Comment: ${data.comment}`
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `Photos: ${data.photos.join(',')}`
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Neighbor"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "plain_text",
        "text": `Is Available: ${neighbor.isAvailable}\nName: ${neighbor.name}\nComment: ${neighbor.comment}\nPhone: ${neighbor.phone}`
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Status"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "plain_text",
        "text": `Status: ${status.status}\nSub Status: ${status.subStatus}\nState: ${status.state}`
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "plain_text",
        "text": `City: ${data.city}\nStreet: ${data.street}\nLGA: ${data.lga}\nState: ${data.state}\nCountry: ${data.country}\nRef: ${data.reference}`
      }
    },
  ]);
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

export const sendUnApprovedCompanyNotification = function sendUnApprovedDispatcherNotification(user) {
  sendSlackNotification(process.env.SLACK_ONBOARDING_CHANNEL_HOOK, 'New Company', [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Type: `Company`\nAction: `Awaiting Approval`"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Name: `" + user.first_name + " " + user.last_name + "` \n• Phone: `" + user.phone + "`\n• Email: `" + user.user_email + "`"
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
        "text": "• Pickup Contact Name: `" + other.contact_name + "` \n • Pickup Contact Phone: `" + other.contact_phone + "`\n • Dropoff Contact Name: `" + other.receiver_contact_fullname + "` \n • Dropoff Contact phone: `" + other.receiver_contact_phone + "`"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Package Id: `" + package_detail.package_id + "` \n• Description: `" + package_detail.description + "`\n• Preferred Transport Mode: `" + package_detail.transport_mode_category + "`\n• Value: `" + package_detail.value + "`\n• Price: `" + package_detail.delivery_price + "` \n• Delivery Key: `" + package_detail.delivery_key + "` \n• Is Express Delivery: `" + package_detail.is_express_delivery + "`"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• From: `" + other.pickup_address + ", " + other.from_state + "` \n• To: `" + other.dropoff_address + ", " + other.to_state + "`"
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
        "text": "• From: `" + other.pickup_address+ "` \n• To: `" + other.dropoff_address + "`"
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

