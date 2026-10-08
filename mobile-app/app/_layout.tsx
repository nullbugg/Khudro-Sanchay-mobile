import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Root */}
      <Stack.Screen name="index" />

      {/* Member */}
      <Stack.Screen name="member/login" />
      <Stack.Screen name="member/dashboard" />
      <Stack.Screen name="member/profile" />
      <Stack.Screen name="member/change-email" />
      <Stack.Screen name="member/change-pin" />
      <Stack.Screen name="member/deposit" />
      <Stack.Screen name="member/pending-deposit" />
      <Stack.Screen name="member/deposit-history" />
      <Stack.Screen name="member/forget-pin" />

      {/* Admin */}
      <Stack.Screen name="admin/login" />
      <Stack.Screen name="admin/dashboard" />
      <Stack.Screen name="admin/create-member" />
      <Stack.Screen name="admin/profile" />
      <Stack.Screen name="admin/email-verification" />
      <Stack.Screen name="admin/change-password" />
      <Stack.Screen name="admin/change-email" />
      <Stack.Screen name="admin/access-member" />
      <Stack.Screen name="admin/weekly-request" />
      <Stack.Screen name="admin/weekly-deposit" />
      <Stack.Screen name="admin/weekly-deposit-history" />

    </Stack>
  );
}