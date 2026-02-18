import { prisma } from '../utils/prisma';
import { decrypt } from '../utils/crypto';

const WATZAP_URL = process.env.WATZAP_URL || 'https://api.watzap.id/v1';

interface WatzapCredentials {
  apiKey: string;
  numberKey: string;
}

async function getCredentials(): Promise<WatzapCredentials> {
  // Try DB first
  const account = await prisma.whatsappAccount.findUnique({
    where: { id: 'default' },
  });

  if (account) {
    return {
      apiKey: decrypt(account.apiKeyEncrypted),
      numberKey: account.phoneNumber,
    };
  }

  // Fallback to env vars
  const apiKey = process.env.WATZAP_API_KEY;
  const numberKey = process.env.WATZAP_NUMBER_KEY;

  if (!apiKey || !numberKey) {
    throw new Error('WhatsApp credentials not configured. Set up via Settings or WATZAP_API_KEY/WATZAP_NUMBER_KEY env vars.');
  }

  return { apiKey, numberKey };
}

export async function checkApiStatus(): Promise<{ status: boolean; message: string }> {
  const { apiKey } = await getCredentials();

  const response = await fetch(`${WATZAP_URL}/checking_key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });

  const result: any = await response.json();
  return {
    status: result.status === true,
    message: result.message || (result.status ? 'Connected' : 'Disconnected'),
  };
}

export async function sendGroupMessage(groupId: string, message: string): Promise<any> {
  const { apiKey, numberKey } = await getCredentials();

  const response = await fetch(`${WATZAP_URL}/send_message_group`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      number_key: numberKey,
      group_id: groupId,
      message,
    }),
  });

  return response.json();
}

export async function sendGroupMessageByDbId(whatsappGroupDbId: string, message: string): Promise<any> {
  const group = await prisma.whatsappGroup.findUnique({
    where: { id: whatsappGroupDbId },
  });

  if (!group) {
    throw new Error(`WhatsApp group not found: ${whatsappGroupDbId}`);
  }

  const decryptedGroupId = decrypt(group.groupIdEncrypted);
  return sendGroupMessage(decryptedGroupId, message);
}
