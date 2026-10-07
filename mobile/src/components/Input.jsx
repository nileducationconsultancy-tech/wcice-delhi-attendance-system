import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../constants/colors';

export const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    autoCorrect = false,
    autoComplete,
    textContentType,
    importantForAutofill,
    returnKeyType,
    onSubmitEditing,
    icon: Icon = null,
    leftIcon = null,
    error = null,
    style,
    inputStyle,
    editable = true,
    inputRef,
    ...rest
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(!secureTextEntry);

    const renderLeftIcon = () => {
        if (leftIcon) {
            return <View style={styles.iconWrapper}>{leftIcon}</View>;
        }
        if (Icon) {
            return (
                <View style={styles.iconWrapper}>
                    <Icon size={18} color={isFocused ? colors.primary : colors.textMuted} />
                </View>
            );
        }
        return null;
    };

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            
            <View style={[
                styles.inputWrapper,
                isFocused && styles.inputFocused,
                Boolean(error) && styles.inputError,
                !editable && styles.inputDisabled
            ]}>
                {renderLeftIcon()}

                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    autoComplete={autoComplete}
                    textContentType={textContentType}
                    importantForAutofill={importantForAutofill}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmitEditing}
                    editable={editable}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={[styles.input, inputStyle]}
                    {...rest}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        activeOpacity={0.7}
                    >
                        {showPassword ? (
                            <EyeOff size={18} color={colors.textMuted} />
                        ) : (
                            <Eye size={18} color={colors.textMuted} />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        backgroundColor: colors.surfaceSubtle,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 14,
        paddingHorizontal: 14
    },
    inputFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.surface
    },
    inputError: {
        borderColor: colors.danger,
        backgroundColor: colors.roseLight
    },
    inputDisabled: {
        opacity: 0.6
    },
    iconWrapper: {
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        height: '100%'
    },
    eyeButton: {
        padding: 4
    },
    errorText: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '600',
        marginTop: 4
    }
});

export default Input;
