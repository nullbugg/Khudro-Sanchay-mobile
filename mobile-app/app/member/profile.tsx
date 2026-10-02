import React, {
    useEffect,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    SafeAreaView,
} from 'react-native-safe-area-context';

import {
    router,
} from 'expo-router';

import {
    getCurrentMember,
    updateMemberProfile,
    Member,
} from '../../lib/member-api';

import {
    getMemberLanguage,
    MemberLanguage,
} from '../../lib/member-language';

/* ========================================================================== */
/* TRANSLATIONS                                                               */
/* ========================================================================== */

const translations = {
    bn: {
        profile:
            'প্রোফাইল',

        personalInformation:
            'ব্যক্তিগত তথ্য',

        memberName:
            'সদস্যের নাম',

        phone:
            'মোবাইল নম্বর',

        joinDate:
            'যোগদানের তারিখ',

        memberId:
            'সদস্য ID',

        status:
            'স্ট্যাটাস',

        active:
            'ACTIVE',

        edit:
            'Edit করুন',

        save:
            'Save Changes',

        cancel:
            'Cancel',

        saving:
            'Saving...',

        loading:
            'তথ্য লোড হচ্ছে...',

        memberNotFound:
            'Member information পাওয়া যায়নি',

        back:
            'ফিরে যান',

        nameRequired:
            'সদস্যের নাম দিন',

        phoneRequired:
            'মোবাইল নম্বর দিন',

        somethingWrong:
            'কিছু সমস্যা হয়েছে',
    },

    en: {
        profile:
            'Profile',

        personalInformation:
            'Personal Information',

        memberName:
            'Member Name',

        phone:
            'Phone Number',

        joinDate:
            'Join Date',

        memberId:
            'Member ID',

        status:
            'Status',

        active:
            'ACTIVE',

        edit:
            'Edit',

        save:
            'Save Changes',

        cancel:
            'Cancel',

        saving:
            'Saving...',

        loading:
            'Loading information...',

        memberNotFound:
            'Member information not found',

        back:
            'Back',

        nameRequired:
            'Please enter member name',

        phoneRequired:
            'Please enter phone number',

        somethingWrong:
            'Something went wrong',
    },
};

/* ========================================================================== */
/* SCREEN                                                                     */
/* ========================================================================== */

export default function MemberProfile() {
    const [
        member,
        setMember,
    ] = useState<Member | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        editing,
        setEditing,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        language,
        setLanguage,
    ] =
        useState<MemberLanguage>(
            'bn'
        );

    const [
        name,
        setName,
    ] = useState('');

    const [
        phone,
        setPhone,
    ] = useState('');

    const [
        error,
        setError,
    ] = useState('');

    const t =
        translations[language];

    /* ---------------------------------------------------------------------- */
    /* Initial Load                                                            */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            setLoading(true);
            setError('');

            const savedLanguage =
                await getMemberLanguage();

            setLanguage(
                savedLanguage
            );

            const result =
                await getCurrentMember();

            console.log(
                'Profile current member:',
                result
            );

            if (
                !result.success ||
                !result.member
            ) {
                setError(
                    result.message ||
                    t.memberNotFound
                );

                return;
            }

            const currentMember =
                result.member;

            setMember(
                currentMember
            );

            setName(
                currentMember.memberName
            );

            setPhone(
                currentMember.phone
            );
        } catch (error) {
            console.error(
                'Profile load error:',
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : t.somethingWrong
            );
        } finally {
            setLoading(false);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Edit                                                                     */
    /* ---------------------------------------------------------------------- */

    function startEditing() {
        if (!member) {
            return;
        }

        setName(
            member.memberName
        );

        setPhone(
            member.phone
        );

        setError('');

        setEditing(true);
    }

    function cancelEditing() {
        if (member) {
            setName(
                member.memberName
            );

            setPhone(
                member.phone
            );
        }

        setError('');

        setEditing(false);
    }

    /* ---------------------------------------------------------------------- */
    /* Save                                                                     */
    /* ---------------------------------------------------------------------- */

    async function saveProfile() {
        const cleanName =
            name.trim();

        const cleanPhone =
            phone.trim();

        if (!cleanName) {
            setError(
                t.nameRequired
            );

            return;
        }

        if (!cleanPhone) {
            setError(
                t.phoneRequired
            );

            return;
        }

        if (!member) {
            setError(
                t.memberNotFound
            );

            return;
        }

        try {
            setSaving(true);
            setError('');

            console.log(
                'Saving profile:',
                {
                    memberId:
                        member.memberId,

                    memberName:
                        cleanName,

                    phone:
                        cleanPhone,
                }
            );

            const result =
                await updateMemberProfile(
                    member.memberId,
                    cleanName,
                    cleanPhone
                );

            console.log(
                'Profile update result:',
                result
            );

            if (!result.success) {
                setError(
                    result.message ||
                    'Profile update করা যায়নি'
                );

                return;
            }

            if (result.member) {
                setMember(
                    result.member
                );

                setName(
                    result.member.memberName
                );

                setPhone(
                    result.member.phone
                );
            } else {
                setMember(
                    (previous) =>
                        previous
                            ? {
                                ...previous,
                                memberName:
                                    cleanName,
                                phone:
                                    cleanPhone,
                            }
                            : previous
                );
            }

            setEditing(false);

            console.log(
                'Profile updated successfully'
            );
        } catch (error) {
            console.error(
                'Save profile error:',
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : 'Profile update করা যায়নি'
            );
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Loading                                                                  */
    /* ---------------------------------------------------------------------- */

    if (loading) {
        return (
            <SafeAreaView
                style={styles.safeArea}
            >
                <View
                    style={
                        styles.loadingContainer
                    }
                >
                    <ActivityIndicator
                        size="large"
                        color="#0f172a"
                    />

                    <Text
                        style={
                            styles.loadingText
                        }
                    >
                        {t.loading}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    /* ---------------------------------------------------------------------- */
    /* Error                                                                     */
    /* ---------------------------------------------------------------------- */

    if (!member) {
        return (
            <SafeAreaView
                style={styles.safeArea}
            >
                <View
                    style={
                        styles.errorContainer
                    }
                >
                    <Text
                        style={
                            styles.errorTitle
                        }
                    >
                        {t.somethingWrong}
                    </Text>

                    <Text
                        style={
                            styles.errorMessage
                        }
                    >
                        {error ||
                            t.memberNotFound}
                    </Text>

                    <Pressable
                        onPress={() =>
                            router.back()
                        }
                        style={
                            styles.backButton
                        }
                    >
                        <Text
                            style={
                                styles.backButtonText
                            }
                        >
                            {t.back}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    /* ---------------------------------------------------------------------- */
    /* Main                                                                     */
    /* ---------------------------------------------------------------------- */

    return (
        <SafeAreaView
            style={styles.safeArea}
        >
            <View
                style={styles.screen}
            >

                {/* ====================================================== */}
                {/* HEADER                                                   */}
                {/* ====================================================== */}

                <View
                    style={styles.header}
                >
                    <Pressable
                        onPress={() =>
                            router.back()
                        }
                        style={
                            styles.backIconButton
                        }
                        hitSlop={8}
                    >
                        <Text
                            style={
                                styles.backIcon
                            }
                        >
                            ‹
                        </Text>
                    </Pressable>

                    <View
                        style={
                            styles.headerTitleContainer
                        }
                    >
                        <Text
                            style={
                                styles.headerTitle
                            }
                        >
                            {t.profile}
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            ক্ষুদ্র সঞ্চয়
                        </Text>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.content
                    }
                >

                    {/* ================================================== */}
                    {/* PROFILE HEADER                                     */}
                    {/* ================================================== */}

                    <View
                        style={
                            styles.profileHeader
                        }
                    >
                        <View
                            style={
                                styles.avatar
                            }
                        >
                            <Text
                                style={
                                    styles.avatarText
                                }
                            >
                                {getInitial(
                                    member.memberName
                                )}
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.profileName
                            }
                        >
                            {member.memberName}
                        </Text>

                        <Text
                            style={
                                styles.profileMemberId
                            }
                        >
                            {member.memberId}
                        </Text>

                        <View
                            style={
                                styles.statusBadge
                            }
                        >
                            <View
                                style={
                                    styles.statusDot
                                }
                            />

                            <Text
                                style={
                                    styles.statusText
                                }
                            >
                                {member.status ||
                                    t.active}
                            </Text>
                        </View>
                    </View>

                    {/* ================================================== */}
                    {/* PERSONAL INFORMATION                               */}
                    {/* ================================================== */}

                    <View
                        style={
                            styles.sectionHeader
                        }
                    >
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            {
                                t.personalInformation
                            }
                        </Text>

                        {!editing && (
                            <Pressable
                                onPress={
                                    startEditing
                                }
                                style={
                                    styles.editButton
                                }
                            >
                                <Text
                                    style={
                                        styles.editButtonText
                                    }
                                >
                                    {t.edit}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    <View
                        style={
                            styles.card
                        }
                    >

                        {/* ------------------------------------------------ */}
                        {/* Name                                             */}
                        {/* ------------------------------------------------ */}

                        <ProfileField
                            label={
                                t.memberName
                            }
                            value={
                                editing
                                    ? name
                                    : member.memberName
                            }
                            editable={
                                editing
                            }
                            onChangeText={
                                setName
                            }
                        />

                        <View
                            style={
                                styles.fieldDivider
                            }
                        />

                        {/* ------------------------------------------------ */}
                        {/* Phone                                            */}
                        {/* ------------------------------------------------ */}

                        <ProfileField
                            label={
                                t.phone
                            }
                            value={
                                editing
                                    ? phone
                                    : member.phone
                            }
                            editable={
                                editing
                            }
                            keyboardType="phone-pad"
                            onChangeText={
                                setPhone
                            }
                        />

                        <View
                            style={
                                styles.fieldDivider
                            }
                        />

                        {/* ------------------------------------------------ */}
                        {/* Join Date                                         */}
                        {/* ------------------------------------------------ */}

                        <ProfileField
                            label={
                                t.joinDate
                            }
                            value={
                                formatDate(
                                    member.joinDate,
                                    language
                                )
                            }
                            editable={false}
                        />

                        {/* ------------------------------------------------ */}
                        {/* Member ID                                         */}
                        {/* ------------------------------------------------ */}

                        <View
                            style={
                                styles.fieldDivider
                            }
                        />

                        <ProfileField
                            label={
                                t.memberId
                            }
                            value={
                                member.memberId
                            }
                            editable={false}
                        />

                        {/* ------------------------------------------------ */}
                        {/* Status                                            */}
                        {/* ------------------------------------------------ */}

                        <View
                            style={
                                styles.fieldDivider
                            }
                        />

                        <ProfileField
                            label={
                                t.status
                            }
                            value={
                                member.status ||
                                t.active
                            }
                            editable={false}
                        />

                    </View>

                    {/* ================================================== */}
                    {/* EDIT ACTIONS                                        */}
                    {/* ================================================== */}

                    {editing && (
                        <View
                            style={
                                styles.actionContainer
                            }
                        >

                            {error !== '' && (
                                <Text
                                    style={
                                        styles.errorText
                                    }
                                >
                                    {error}
                                </Text>
                            )}

                            <View
                                style={
                                    styles.actionRow
                                }
                            >
                                <Pressable
                                    onPress={
                                        cancelEditing
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={
                                        styles.cancelButton
                                    }
                                >
                                    <Text
                                        style={
                                            styles.cancelButtonText
                                        }
                                    >
                                        {t.cancel}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={
                                        saveProfile
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={
                                        styles.saveButton
                                    }
                                >
                                    {saving ? (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                        />
                                    ) : (
                                        <Text
                                            style={
                                                styles.saveButtonText
                                            }
                                        >
                                            {t.save}
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {!editing &&
                        error !== '' && (
                            <Text
                                style={
                                    styles.errorText
                                }
                            >
                                {error}
                            </Text>
                        )}

                    <View
                        style={{
                            height: 35,
                        }}
                    />

                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

/* ========================================================================== */
/* PROFILE FIELD                                                              */
/* ========================================================================== */

function ProfileField({
    label,
    value,
    editable,
    onChangeText,
    keyboardType,
}: {
    label: string;
    value: string;
    editable: boolean;
    onChangeText?: (
        value: string
    ) => void;
    keyboardType?:
    | 'default'
    | 'phone-pad';
}) {
    return (
        <View
            style={
                styles.fieldContainer
            }
        >
            <Text
                style={
                    styles.fieldLabel
                }
            >
                {label}
            </Text>

            {editable ? (
                <TextInput
                    value={value}
                    onChangeText={
                        onChangeText
                    }
                    keyboardType={
                        keyboardType ||
                        'default'
                    }
                    style={
                        styles.input
                    }
                    placeholder={
                        label
                    }
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="words"
                />
            ) : (
                <Text
                    style={
                        styles.fieldValue
                    }
                >
                    {value || '-'}
                </Text>
            )}
        </View>
    );
}

/* ========================================================================== */
/* HELPERS                                                                    */
/* ========================================================================== */

function getInitial(
    name: string
) {
    const trimmed =
        name?.trim();

    return (
        trimmed
            ?.charAt(0)
            .toUpperCase() || 'M'
    );
}

function formatDate(
    date: string,
    language: MemberLanguage
) {
    if (!date) {
        return '-';
    }

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return date;
    }

    return parsed.toLocaleDateString(
        language === 'bn'
            ? 'bn-BD'
            : 'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    );
}

/* ========================================================================== */
/* STYLES                                                                     */
/* ========================================================================== */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor:
            '#f6f8fb',
    },

    screen: {
        flex: 1,
        backgroundColor:
            '#f6f8fb',
    },

    /* Header */

    header: {
        height: 72,
        paddingHorizontal: 18,
        backgroundColor:
            '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor:
            '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },

    backIconButton: {
        width: 42,
        height: 42,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent:
            'center',
    },

    backIcon: {
        fontSize: 35,
        lineHeight: 38,
        color: '#0f172a',
        fontWeight: '300',
    },

    headerTitleContainer: {
        marginLeft: 7,
    },

    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },

    headerSubtitle: {
        marginTop: 2,
        fontSize: 10,
        color: '#64748b',
    },

    /* Content */

    content: {
        paddingHorizontal: 18,
        paddingTop: 20,
    },

    /* Profile Header */

    profileHeader: {
        paddingVertical: 25,
        paddingHorizontal: 20,
        borderRadius: 19,
        backgroundColor:
            '#0f172a',
        alignItems: 'center',
    },

    avatar: {
        width: 72,
        height: 72,
        borderRadius: 21,
        backgroundColor:
            '#1e293b',
        alignItems: 'center',
        justifyContent:
            'center',
        borderWidth: 2,
        borderColor:
            '#334155',
    },

    avatarText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
    },

    profileName: {
        marginTop: 13,
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
    },

    profileMemberId: {
        marginTop: 4,
        fontSize: 11,
        color: '#94a3b8',
    },

    statusBadge: {
        marginTop: 12,
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor:
            '#1e293b',
        flexDirection: 'row',
        alignItems: 'center',
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor:
            '#22c55e',
        marginRight: 6,
    },

    statusText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.5,
    },

    /* Section */

    sectionHeader: {
        marginTop: 24,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
    },

    editButton: {
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 9,
        backgroundColor:
            '#e2e8f0',
    },

    editButtonText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#334155',
    },

    /* Card */

    card: {
        borderRadius: 17,
        borderWidth: 1,
        borderColor:
            '#e2e8f0',
        backgroundColor:
            '#ffffff',
        paddingHorizontal: 17,
    },

    fieldContainer: {
        paddingVertical: 15,
    },

    fieldLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 6,
    },

    fieldValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },

    input: {
        minHeight: 43,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1,
        borderColor:
            '#cbd5e1',
        backgroundColor:
            '#f8fafc',
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },

    fieldDivider: {
        height: 1,
        backgroundColor:
            '#e2e8f0',
    },

    /* Actions */

    actionContainer: {
        marginTop: 14,
    },

    errorText: {
        marginBottom: 10,
        fontSize: 11,
        lineHeight: 17,
        color: '#dc2626',
        textAlign: 'center',
    },

    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 11,
        backgroundColor:
            '#e2e8f0',
        alignItems: 'center',
        justifyContent:
            'center',
    },

    cancelButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#334155',
    },

    saveButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 11,
        backgroundColor:
            '#0f172a',
        alignItems: 'center',
        justifyContent:
            'center',
    },

    saveButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
    },

    /* Loading */

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent:
            'center',
        backgroundColor:
            '#f6f8fb',
    },

    loadingText: {
        marginTop: 12,
        fontSize: 12,
        color: '#64748b',
    },

    /* Error */

    errorContainer: {
        flex: 1,
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent:
            'center',
        backgroundColor:
            '#f6f8fb',
    },

    errorTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },

    errorMessage: {
        marginTop: 7,
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 19,
        color: '#64748b',
    },

    backButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 11,
        backgroundColor:
            '#0f172a',
    },

    backButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#ffffff',
    },
});