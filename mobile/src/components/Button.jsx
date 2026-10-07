import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

export const Button = ({
    title,
    onPress,
    variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline'
    loading = false,
    disabled = false,
    icon = null,
    style,
    textStyle
}) => {
    const isPrimary = variant === 'primary';
    const isDanger = variant === 'danger';
    const isOutline = variant === 'outline';
    const isSecondary = variant === 'secondary';

    const getBackgroundColor = () => {
        if (disabled) return colors.surfaceSubtle;
        if (isPrimary) return colors.primary;
        if (isDanger) return colors.danger;
        if (isSecondary) return colors.blue;
        if (isOutline) return 'transparent';
        return colors.primary;
    };

    const getTextColor = () => {
        if (disabled) return colors.textMuted;
        if (isOutline) return colors.textPrimary;
        return colors.textInverse;
    };

    const renderIcon = () => {
        if (!icon) return null;
        if (React.isValidElement(icon)) {
            return <View style={styles.icon}>{icon}</View>;
        }
        const IconComponent = icon;
        return <IconComponent size={18} color={getTextColor()} style={styles.icon} />;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                isOutline && { borderWidth: 1, borderColor: colors.border },
                disabled && { borderColor: colors.border },
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <View style={styles.content}>
                    {renderIcon()}
                    <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    icon: {
        marginRight: 8
    },
    text: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2
    }
});

export default Button;
