import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import {
  loadHistory,
  clearHistory,
  deleteMeasurement,
  SQMMeasurement,
} from "../utils/storage";

export default function HistoryScreen() {
  const [history, setHistory] = useState<SQMMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await loadHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
      Alert.alert("Error", "Failed to load measurement history");
    } finally {
      setLoading(false);
    }
  };

  // Reload history whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const handleClearAll = () => {
    Alert.alert(
      "Clear All History",
      "Are you sure you want to delete all measurements? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearHistory();
              setHistory([]);
              Alert.alert("Success", "All measurements cleared");
            } catch (error) {
              console.error("Failed to clear history:", error);
              Alert.alert("Error", "Failed to clear history");
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      "Delete Measurement",
      "Are you sure you want to delete this measurement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMeasurement(id);
              setHistory(history.filter((item) => item.id !== id));
            } catch (error) {
              console.error("Failed to delete measurement:", error);
              Alert.alert("Error", "Failed to delete measurement");
            }
          },
        },
      ]
    );
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLocation = (location: SQMMeasurement["location"]) => {
    if (!location) return "No location";
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const renderItem = ({ item }: { item: SQMMeasurement }) => (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Date</Text>
          <Text style={styles.cellValue}>{formatDate(item.timestamp)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>SQM</Text>
          <Text style={[styles.cellValue, styles.sqmValue]}>
            {item.sqm.toFixed(2)}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Location</Text>
          <Text style={styles.cellValueSmall}>
            {formatLocation(item.location)}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => handleDeleteItem(item.id)}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && { opacity: 0.5 },
        ]}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyTableHeader}>
        <Text style={styles.emptyTableHeaderText}>Date</Text>
        <Text style={styles.emptyTableHeaderText}>SQM</Text>
        <Text style={styles.emptyTableHeaderText}>Location</Text>
      </View>
      <View style={styles.emptyTableBody}>
        <Text style={styles.emptyText}>No measurements yet</Text>
        <Text style={styles.emptySubtext}>
          Take some sky quality measurements to see them appear here
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>Measurement History</Text>
        {history.length > 0 && (
          <Pressable
            onPress={handleClearAll}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
        )}
      </View> */}

      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            history.length === 0
              ? styles.emptyListContainer
              : styles.listContent
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ff0000",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff0000",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ff0000",
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#ff0000",
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ff0000",
    fontSize: 16,
  },
  listContent: {
    padding: 10,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: 20,
  },
  emptyTableHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ff0000",
    backgroundColor: "#1a0000",
    marginHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: "#ff0000",
  },
  emptyTableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff0000",
    flex: 1,
    textAlign: "center",
  },
  emptyTableBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginHorizontal: 10,
    backgroundColor: "#0a0000",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#ff0000",
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#ff0000",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ff0000",
    opacity: 0.7,
    textAlign: "center",
  },
  row: {
    backgroundColor: "#1a0000",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ff0000",
  },
  rowContent: {
    marginBottom: 10,
  },
  cell: {
    marginBottom: 8,
  },
  cellLabel: {
    fontSize: 12,
    color: "#ff0000",
    opacity: 0.7,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 16,
    color: "#ff0000",
  },
  cellValueSmall: {
    fontSize: 14,
    color: "#ff0000",
  },
  sqmValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  deleteButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ff0000",
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "#ff0000",
    fontSize: 12,
  },
});
