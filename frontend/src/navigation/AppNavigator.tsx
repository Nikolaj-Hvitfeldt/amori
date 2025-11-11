import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import DatesScreen from '../screens/DatesScreen';
import PicturesScreen from '../screens/PicturesScreen';
import StoriesScreen from '../screens/StoriesScreen';

export type RootTabParamList = {
  Home: undefined;
  Stories: undefined;
  Dates: undefined;
  Pictures: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabBarIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  return (
    <Text style={{ fontSize: 24, color: focused ? '#FF6B9D' : '#999' }}>
      {name === 'Home' && '🏠'}
      {name === 'Stories' && '💕'}
      {name === 'Dates' && '📅'}
      {name === 'Pictures' && '📸'}
    </Text>
  );
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: '#FF6B9D',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#FFF',
            borderTopColor: '#FEC7D7',
            borderTopWidth: 1,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerStyle: {
            backgroundColor: '#FF6B9D',
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Our Timeline' }}
        />
        <Tab.Screen 
          name="Stories" 
          component={StoriesScreen}
          options={{ title: 'Love Stories' }}
        />
        <Tab.Screen 
          name="Dates" 
          component={DatesScreen}
          options={{ title: 'Special Dates' }}
        />
        <Tab.Screen 
          name="Pictures" 
          component={PicturesScreen}
          options={{ title: 'Memories' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
