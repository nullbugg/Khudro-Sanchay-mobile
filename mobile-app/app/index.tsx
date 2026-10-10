import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Image } from 'react-native';
import { getCurrentMember } from '../lib/member-api';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Language = 'bn' | 'en';

const translations = {
  bn: {
    appName: 'ক্ষুদ্র সঞ্চয়',
    appSubtitle: 'সমবায় সমিতি',
    management: 'Management System',

    badge: 'নিরাপদ ও সহজ সঞ্চয় ব্যবস্থাপনা',

    title1: 'আপনার সঞ্চয়,',
    title2: 'আপনার নিয়ন্ত্রণে',

    description:
      'ক্ষুদ্র সঞ্চয় সমবায় সমিতির সদস্য ও অ্যাডমিনদের জন্য একটি সহজ, নিরাপদ এবং আধুনিক ব্যবস্থাপনা প্ল্যাটফর্ম।',

    memberLogin: 'মেম্বার লগইন',
    memberDescription:
      'আপনার সদস্য অ্যাকাউন্টে প্রবেশ করে সঞ্চয় ও হিসাব দেখুন।',
    memberButton: 'লগইন করুন',

    adminLogin: 'অ্যাডমিন লগইন',
    adminDescription:
      'সমিতির সদস্য, সাপ্তাহিক জমা এবং অন্যান্য কার্যক্রম পরিচালনা করুন।',
    adminButton: 'অ্যাডমিন হিসেবে লগইন করুন',

    createAccount: 'নতুন অ্যাকাউন্ট তৈরি করুন',
    createAccountSub: 'আপনার মেম্বার অ্যাকাউন্ট নেই?',
    createAccountButton: 'অ্যাকাউন্ট তৈরি করুন',

    secure: 'নিরাপদ',
    secureDescription:
      'আপনার অ্যাকাউন্ট ও তথ্য নিরাপদভাবে সংরক্ষণ করা হয়।',

    savings: 'সঞ্চয় হিসাব',
    savingsDescription:
      'সাপ্তাহিক জমা, বকেয়া ও অগ্রিমের হিসাব সহজে দেখুন।',

    managementFeature: 'সহজ ব্যবস্থাপনা',
    managementDescription:
      'সদস্য ও সমিতির কার্যক্রম এক জায়গা থেকে পরিচালনা করুন।',

    footer: 'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',
    developer: 'ডেভেলপার - আব্দুল আলিম সরকার',
    rights: 'সর্বস্বত্ব সংরক্ষিত।',
  },

  en: {
    appName: 'ক্ষুদ্র সঞ্চয়',
    appSubtitle: 'সমবায় সমিতি',
    management: 'Management System',

    badge: 'Safe & Simple Savings Management',

    title1: 'Your Savings,',
    title2: 'Under Your Control',

    description:
      'A simple, secure and modern management platform for members and administrators of the savings cooperative society.',

    memberLogin: 'Member Login',
    memberDescription:
      'Access your member account and view your savings and account history.',
    memberButton: 'Login',

    adminLogin: 'Admin Login',
    adminDescription:
      'Manage members, weekly collections and other cooperative activities.',
    adminButton: 'Login as Admin',

    createAccount: 'Create a New Account',
    createAccountSub: "Don't have a member account?",
    createAccountButton: 'Create Account',

    secure: 'Secure',
    secureDescription:
      'Your account and information are stored securely.',

    savings: 'Savings Tracking',
    savingsDescription:
      'Easily view weekly deposits, dues and advance payments.',

    managementFeature: 'Easy Management',
    managementDescription:
      'Manage members and cooperative activities from one place.',

    footer: 'ক্ষুদ্র সঞ্চয় সমবায় সমিতি',
    developer: 'Developer - Abdul Alim Sarkar',
    rights: 'All rights reserved.',
  },
};

export default function HomeScreen() {
  const [language, setLanguage] = useState<Language>('bn');
  const [checkingSession, setCheckingSession] = useState(true);

  const t = translations[language];


  useEffect(() => {
    let isMounted = true;
    const startedAt = Date.now();
    const minimumSplashTime = 1200;

    const checkMemberSession = async () => {
      try {
        const result = await getCurrentMember();

        const remainingTime = Math.max(
          0,
          minimumSplashTime - (Date.now() - startedAt)
        );

        if (remainingTime > 0) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, remainingTime);
          });
        }

        if (!isMounted) return;

        if (result.success && result.member?.memberId) {
          router.replace('/member/dashboard');
          return;
        }

        setCheckingSession(false);
      } catch (error) {
        console.error('Member session check error:', error);

        const remainingTime = Math.max(
          0,
          minimumSplashTime - (Date.now() - startedAt)
        );

        if (remainingTime > 0) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, remainingTime);
          });
        }

        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    checkMemberSession();

    return () => {
      isMounted = false;
    };
  }, []);




  if (checkingSession) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <View style={styles.splashContent}>
          <View style={styles.splashLogoContainer}>
            <Image
              source={require('../assets/splash-logo.png')}
              style={styles.splashLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.splashAppName}>
            ক্ষুদ্র সঞ্চয়
          </Text>

          <Text style={styles.splashSubtitle}>
            সমবায় সমিতি
          </Text>

          <View style={styles.splashDivider} />

          <ActivityIndicator
            size="large"
            color="#0f172a"
            style={styles.splashLoader}
          />

          <Text style={styles.splashLoadingText}>
            আপনার তথ্য যাচাই করা হচ্ছে...
          </Text>
        </View>

        <View style={styles.splashFooter}>
          <Text style={styles.splashFooterText}>
            ক্ষুদ্র সঞ্চয় সমবায় সমিতি
          </Text>

          <Text style={styles.splashDeveloper}>
            Developed by Abdul Alim Sarkar
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>৳</Text>
            </View>

            <View>
              <Text style={styles.appName}>{t.appName}</Text>
              <Text style={styles.appSubtitle}>{t.appSubtitle}</Text>
            </View>
          </View>

          {/* Language Selector */}
          <View style={styles.languageSelector}>
            <Pressable
              onPress={() => setLanguage('bn')}
              style={[
                styles.languageButton,
                language === 'bn' && styles.languageButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.languageText,
                  language === 'bn' && styles.languageTextActive,
                ]}
              >
                বাংলা
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setLanguage('en')}
              style={[
                styles.languageButton,
                language === 'en' && styles.languageButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.languageText,
                  language === 'en' && styles.languageTextActive,
                ]}
              >
                EN
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>

            <Text style={styles.badgeText}>{t.badge}</Text>
          </View>

          <Text style={styles.title}>
            {t.title1}
            {'\n'}
            <Text style={styles.titleSecondary}>{t.title2}</Text>
          </Text>

          <Text style={styles.description}>{t.description}</Text>
        </View>

        {/* Login Cards */}
        <View style={styles.loginSection}>
          {/* Member */}
          <LoginCard
            icon="👥"
            title={t.memberLogin}
            description={t.memberDescription}
            buttonText={t.memberButton}
            type="member"
            href="/member/login"
            createAccount={t.createAccount}
            createAccountSub={t.createAccountSub}
            createAccountButton={t.createAccountButton}
          />

          {/* Admin */}
          <LoginCard
            icon="♙"
            title={t.adminLogin}
            description={t.adminDescription}
            buttonText={t.adminButton}
            type="admin"
            href="/admin/login"
          />
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureCard
            icon="✓"
            title={t.secure}
            description={t.secureDescription}
          />

          <FeatureCard
            icon="৳"
            title={t.savings}
            description={t.savingsDescription}
          />

          <FeatureCard
            icon="↗"
            title={t.managementFeature}
            description={t.managementDescription}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>{t.footer}</Text>

          <Text style={styles.footerText}>
            {t.developer}
          </Text>

          <Text style={styles.footerText}>
            © {new Date().getFullYear()} {t.rights}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Login Card                                                                 */
/* -------------------------------------------------------------------------- */

function LoginCard({
  icon,
  title,
  description,
  buttonText,
  type,
  href,
  createAccount,
  createAccountSub,
  createAccountButton,
}: {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  type: 'member' | 'admin';
  href: '/member/login' | '/admin/login';
  createAccount?: string;
  createAccountSub?: string;
  createAccountButton?: string;
}) {
  const isMember = type === 'member';

  return (
    <View style={styles.loginCard}>
      {/* Card Header */}
      <View style={styles.loginCardHeader}>
        {/* Left: Icon */}
        <View
          style={[
            styles.loginIconCircle,
            isMember
              ? styles.memberIconCircle
              : styles.adminIconCircle,
          ]}
        >
          <Text
            style={[
              styles.loginIcon,
              !isMember && styles.loginIconWhite,
            ]}
          >
            {icon}
          </Text>
        </View>

        {/* Center: Title */}
        <Text style={styles.loginTitle}>{title}</Text>

        {/* Right: Type Badge */}
        <View
          style={[
            styles.loginTypeBadge,
            isMember
              ? styles.memberBadge
              : styles.adminBadge,
          ]}
        >
          <View
            style={[
              styles.loginBadgeDot,
              isMember
                ? styles.memberBadgeDot
                : styles.adminBadgeDot,
            ]}
          />

          <Text
            style={[
              styles.loginTypeText,
              isMember
                ? styles.memberBadgeText
                : styles.adminBadgeText,
            ]}
          >
            {isMember ? 'MEMBER' : 'ADMIN'}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.loginDescription}>
        {description}
      </Text>

      {/* Buttons */}
      <View
        style={[
          styles.loginButtons,
          isMember && styles.memberLoginButtons,
        ]}
      >
        {/* Create Account - Member Only */}
        {isMember &&
          createAccount &&
          createAccountSub &&
          createAccountButton && (
            <Pressable
              onPress={() => {
                router.push('/member/create-account');
              }}
              style={styles.createAccountButton}
            >
              <Text style={styles.createAccountIcon}>+</Text>

              <Text style={styles.createAccountText}>
                {createAccountButton}
              </Text>
            </Pressable>
          )}

        {/* Login */}
        <Pressable
          onPress={() => router.push(href)}
          style={[
            styles.loginButton,
            isMember
              ? styles.memberButton
              : styles.adminButton,
          ]}
        >
          <Text
            style={[
              styles.loginButtonText,
              !isMember && styles.loginButtonTextWhite,
            ]}
          >
            {buttonText}
          </Text>

          <Text
            style={[
              styles.loginButtonIcon,
              !isMember && styles.loginButtonIconWhite,
            ]}
          >
            →
          </Text>
        </Pressable>
      </View>

      {/* Member Helper Text */}
      {isMember &&
        createAccountSub &&
        createAccount && (
          <Text style={styles.createAccountSub}>
            {createAccountSub}
          </Text>
        )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature Card                                                               */
/* -------------------------------------------------------------------------- */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>

      <Text style={styles.featureTitle}>{title}</Text>

      <Text style={styles.featureDescription}>
        {description}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },

  scrollContent: {
    paddingBottom: 30,
  },

  /* ---------------------------------------------------------------------- */
  /* Header                                                                 */
  /* ---------------------------------------------------------------------- */

  header: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  logoText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },

  appName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },

  appSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
  },

  /* ---------------------------------------------------------------------- */
  /* Language Selector                                                      */
  /* ---------------------------------------------------------------------- */

  languageSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
  },

  languageButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },

  languageButtonActive: {
    backgroundColor: '#0f172a',
  },

  languageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },

  languageTextActive: {
    color: '#ffffff',
  },

  /* ---------------------------------------------------------------------- */
  /* Hero                                                                   */
  /* ---------------------------------------------------------------------- */

  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  checkCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  checkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  title: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '800',
    color: '#0f172a',
  },

  titleSecondary: {
    color: '#475569',
  },

  description: {
    maxWidth: 520,
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 22,
    color: '#64748b',
  },

  /* ---------------------------------------------------------------------- */
  /* Login Section                                                          */
  /* ---------------------------------------------------------------------- */

  loginSection: {
    paddingHorizontal: 20,
  },

  loginCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  /* Header: Icon | Title | Badge */
  loginCardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  loginIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberIconCircle: {
    backgroundColor: '#f1f5f9',
  },

  adminIconCircle: {
    backgroundColor: '#0f172a',
  },

  loginIcon: {
    fontSize: 22,
  },

  loginIconWhite: {
    color: '#ffffff',
  },

  /* Title in the middle */
  loginTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },

  /* Type Badge */
  loginTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  memberBadge: {
    backgroundColor: '#f0fdf4',
  },

  adminBadge: {
    backgroundColor: '#f1f5f9',
  },

  loginBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  memberBadgeDot: {
    backgroundColor: '#10b981',
  },

  adminBadgeDot: {
    backgroundColor: '#64748b',
  },

  loginTypeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  memberBadgeText: {
    color: '#059669',
  },

  adminBadgeText: {
    color: '#475569',
  },

  /* Description */
  loginDescription: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 21,
    color: '#64748b',
    textAlign: 'center',
  },

  /* Buttons */
  loginButtons: {
    width: '100%',
    marginTop: 18,
  },

  memberLoginButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  loginButton: {
    minHeight: 46,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  adminButton: {
    width: '100%',
    backgroundColor: '#0f172a',
  },

  loginButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },

  loginButtonTextWhite: {
    color: '#ffffff',
  },

  loginButtonIcon: {
    marginLeft: 7,
    fontSize: 17,
    color: '#1e293b',
  },

  loginButtonIconWhite: {
    color: '#ffffff',
  },

  /* Create Account */
  createAccountButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  createAccountIcon: {
    fontSize: 19,
    color: '#475569',
    marginRight: 6,
  },

  createAccountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
  },

  createAccountSub: {
    marginTop: 8,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },

  /* ---------------------------------------------------------------------- */
  /* Splash                                                                 */
  /* ---------------------------------------------------------------------- */


  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  splashContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  splashLogoContainer: {
    width: 124,
    height: 124,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  splashLogo: {
    width: 104,
    height: 104,
  },

  splashAppName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },

  splashSubtitle: {
    marginTop: 7,
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },

  splashDivider: {
    width: 54,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0f172a',
    marginTop: 24,
  },

  splashLoader: {
    marginTop: 30,
  },

  splashLoadingText: {
    marginTop: 14,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },

  splashFooter: {
    alignItems: 'center',
    paddingBottom: 22,
  },

  splashFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },

  splashDeveloper: {
    marginTop: 6,
    fontSize: 10,
    color: '#94a3b8',
  },


  /* ---------------------------------------------------------------------- */
  /* Features                                                               */
  /* ---------------------------------------------------------------------- */

  features: {
    paddingHorizontal: 20,
    marginTop: 18,
  },

  featureCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 15,
    padding: 16,
    marginBottom: 10,
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
  },

  featureTitle: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },

  featureDescription: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 18,
    color: '#64748b',
  },

  /* ---------------------------------------------------------------------- */
  /* Footer                                                                 */
  /* ---------------------------------------------------------------------- */

  footer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  footerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },

  footerText: {
    marginTop: 4,
    fontSize: 10,
    color: '#94a3b8',
  },
});