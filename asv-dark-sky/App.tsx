import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import CameraScreen from "./screens/CameraScreen";
import MapScreen from "./screens/MapScreen";
import HistoryScreen from "./screens/HistoryScreen";
import InfoScreen from "./screens/InfoScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#ff0000",
          tabBarInactiveTintColor: "#666666",
          tabBarStyle: {
            backgroundColor: "#000000",
            borderTopColor: "#ff0000",
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: "#000000",
            borderBottomColor: "#ff0000",
            borderBottomWidth: 1,
          },
          headerTintColor: "#ff0000",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tab.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="camera" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="history" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Info"
          component={InfoScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="info-circle" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
