import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, AlertCircle, Check } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/constants/colors';
import { storage } from '../../src/utils/storage';
import { showContactHROptions, openWhatsAppHR } from '../../src/utils/contactHr';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const passwordInputRef = useRef(null);
    const { login, isLoggingIn, error, clearError } = useAuthStore();

    useEffect(() => {
        const loadSavedCredentials = async () => {
            try {
                const saved = await storage.getItem('saved_login_email');
                const pref = await storage.getItem('remember_me_pref');
                if (saved) {
                    setEmail(saved);
                }
                if (pref !== null) {
                    setRememberMe(pref === 'true');
                }
            } catch (e) {
                // Ignore storage read error
            }
        };
        loadSavedCredentials();
    }, []);

    const handleLogin = async () => {
        const cleanEmail = email.trim();
        const cleanPass = password.trim();

        if (!cleanEmail || !cleanPass) {
            Alert.alert('Required Fields', 'Please enter your Gmail and password.');
            return;
        }

        if (clearError) clearError();
        const res = await login(cleanEmail, cleanPass);
        if (!res?.success) {
            const errorMsg = res?.error || 'Gmail or password is wrong';
            Alert.alert('Login Failed', errorMsg);
        } else {
            // Save or clear remember email preference
            try {
                if (rememberMe) {
                    await storage.setItem('saved_login_email', cleanEmail);
                    await storage.setItem('remember_me_pref', 'true');
                } else {
                    await storage.removeItem('saved_login_email');
                    await storage.setItem('remember_me_pref', 'false');
                }
            } catch (e) {
                // Ignore storage save error
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Centered Logo Branding */}
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../../assets/nile-logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Welcome Headings */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>Welcome Back 👋</Text>
                        <Text style={styles.welcomeSub}>Login to your account</Text>
                    </View>

                    {/* Error Banner */}
                    {error && (
                        <View style={styles.errorBanner}>
                            <AlertCircle size={18} color={colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <Input
                            label="Gmail / Email Address"
                            placeholder="yourname@gmail.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (error) clearError();
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            textContentType="username"
                            importantForAutofill="yes"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                            leftIcon={<Mail size={18} color={error ? colors.danger : colors.textMuted} />}
                        />

                        <Input
                            inputRef={passwordInputRef}
                            label="Password"
                            placeholder="••••••••••••"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (error) clearError();
                            }}
                            secureTextEntry
                            autoComplete="current-password"
                            textContentType="password"
                            importantForAutofill="yes"
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                            leftIcon={<Lock size={18} color={error ? colors.danger : colors.textMuted} />}
                        />

                        {/* Options: Remember Me & Forgot Password */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.rememberMeContainer}
                                onPress={() => setRememberMe(!rememberMe)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                                    {rememberMe && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
                                </View>
                                <Text style={styles.rememberMeText}>Remember me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.forgotPasswordContainer}
                                onPress={() => showContactHROptions('Reset Password', 'To reset your password, connect with WECICE HR support team:')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <Button
                            title="Login"
                            onPress={handleLogin}
                            loading={isLoggingIn}
                            style={styles.loginBtn}
                        />

                        {/* OR Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Social Button */}
                        <TouchableOpacity
                            style={styles.googleBtn}
                            onPress={() => Alert.alert('Google Sign-In', 'Google SSO integration is available for WECICE corporate Google Workspace accounts.')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.googleIconText}>G</Text>
                            <Text style={styles.googleBtnText}>Continue with Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Contact HR */}
                    <TouchableOpacity
                        style={styles.footer}
                        onPress={() => showContactHROptions('Need Help?', 'Connect directly with WECICE HR via WhatsApp or Call:')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.footerText}>
                            Need help? <Text style={styles.contactHrText}>Contact HR (WhatsApp / Call)</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background
    },
    keyboardView: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 28
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 20
    },
    logoImage: {
        width: 200,
        height: 65
    },
    welcomeSection: {
        marginBottom: 24
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5
    },
    welcomeSub: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.dangerLight,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8
    },
    errorText: {
        fontSize: 13,
        color: colors.danger,
        flex: 1,
        fontWeight: '500'
    },
    formContainer: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2
    },
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
        marginBottom: 20
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    rememberMeText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textSecondary
    },
    forgotPasswordContainer: {
        alignSelf: 'center'
    },
    forgotPasswordText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary
    },
    loginBtn: {
        backgroundColor: colors.primary,
        height: 48,
        borderRadius: 12
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted
    },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8
    },
    googleIconText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#EA4335'
    },
    googleBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary
    },
    footer: {
        alignItems: 'center',
        marginTop: 28
    },
    footerText: {
        fontSize: 13,
        color: colors.textSecondary
    },
    contactHrText: {
        fontWeight: '700',
        color: colors.primary
    }
});
