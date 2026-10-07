import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import {
    Home,
    CalendarCheck,
    FolderKanban,
    ReceiptText,
    UserCircle2
} from 'lucide-react-native';
import { colors } from '../../src/constants/colors';

export default function EmployeeLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.tabBarInactive,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarItemStyle: styles.tabBarItem,
                tabBarHideOnKeyboard: true
            }}
        >
            {/* 1. Home / Dashboard */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            {/* 2. Attendance */}
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color, focused }) => (
                        <CalendarCheck size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            {/* 3. Documents */}
            <Tabs.Screen
                name="documents"
                options={{
                    title: 'Documents',
                    tabBarIcon: ({ color, focused }) => (
                        <FolderKanban size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            {/* 4. Payslips */}
            <Tabs.Screen
                name="payslips"
                options={{
                    title: 'Payslips',
                    tabBarIcon: ({ color, focused }) => (
                        <ReceiptText size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            {/* 5. Profile */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <UserCircle2 size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                    )
                }}
            />

            {/* Sub-screens hidden from bottom tab bar */}
            <Tabs.Screen
                name="checkin"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' }
                }}
            />

            <Tabs.Screen
                name="holidays"
                options={{
                    href: null
                }}
            />

            <Tabs.Screen
                name="notifications"
                options={{
                    href: null
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    href: null
                }}
            />

            <Tabs.Screen
                name="privacy"
                options={{
                    href: null
                }}
            />

            <Tabs.Screen
                name="add-employee"
                options={{
                    href: null
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 6
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2
    },
    tabBarItem: {
        paddingVertical: 2
    }
});
