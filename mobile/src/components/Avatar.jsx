import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { resolveMediaUrl } from '../utils/media';

export default function Avatar({
    uri = null,
    name = 'Employee',
    size = 36,
    bgColor = '#EFF6FF',
    textColor = '#1E60FF',
    borderColor = '#BFDBFE',
    borderWidth = 1,
    style = {},
    textStyle = {}
}) {
    const [imageError, setImageError] = useState(false);
    const resolvedUrl = resolveMediaUrl(uri);
    const initial = (name && typeof name === 'string' && name.trim().length > 0)
        ? name.trim().charAt(0).toUpperCase()
        : 'E';

    const fontSize = Math.max(10, Math.round(size * 0.42));

    if (resolvedUrl && !imageError) {
        return (
            <View
                style={[
                    styles.avatarContainer,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                        borderWidth: borderWidth
                    },
                    style
                ]}
            >
                <Image
                    key={resolvedUrl}
                    source={{ uri: resolvedUrl }}
                    style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                />
            </View>
        );
    }

    return (
        <View
            style={[
                styles.avatarContainer,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: borderWidth
                },
                style
            ]}
        >
            <Text
                style={[
                    styles.initialText,
                    {
                        color: textColor,
                        fontSize: fontSize
                    },
                    textStyle
                ]}
            >
                {initial}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    avatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    initialText: {
        fontWeight: '800'
    }
});
