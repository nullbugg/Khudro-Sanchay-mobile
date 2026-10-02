import * as SecureStore from 'expo-secure-store';

import type { Member } from './member-api';

const MEMBER_SESSION_KEY = 'khudro_sanchoy_member_session';

export async function saveMemberSession(
  member: Member
): Promise<void> {
  await SecureStore.setItemAsync(
    MEMBER_SESSION_KEY,
    JSON.stringify(member)
  );
}

export async function getMemberSession(): Promise<Member | null> {
  try {
    const value =
      await SecureStore.getItemAsync(
        MEMBER_SESSION_KEY
      );

    if (!value) {
      return null;
    }

    return JSON.parse(value) as Member;
  } catch (error) {
    console.error(
      'Get member session error:',
      error
    );

    return null;
  }
}

export async function clearMemberSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(
      MEMBER_SESSION_KEY
    );
  } catch (error) {
    console.error(
      'Clear member session error:',
      error
    );
  }
}