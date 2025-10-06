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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: SQMMeasurement }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View>
        <Pressable
          onPress={() => toggleExpand(item.id)}
          style={({ pressed }) => [
            styles.row,
            pressed && { backgroundColor: "#1a0000" },
          ]}
        >
          <View style={styles.cell}>
            <Text style={styles.cellValue} numberOfLines={1}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
          <View style={styles.cellSqm}>
            <Text style={styles.sqmValue}>{item.sqm.toFixed(2)}</Text>
          </View>
          <View style={styles.cellLocation}>
            <Text style={styles.cellValueSmall} numberOfLines={1}>
              {formatLocation(item.location)}
            </Text>
          </View>
          <View style={styles.expandIndicator}>
            <Text style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteItem(item.id);
            }}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.deleteButtonText}>&times;</Text>
          </Pressable>
        </Pressable>

        {isExpanded && (
          <View style={styles.expandedPanel}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time:</Text>
              <Text style={styles.detailValue}>
                {new Date(item.timestamp).toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>SQM Reading:</Text>
              <Text style={[styles.detailValue, styles.detailValueLarge]}>
                {item.sqm.toFixed(2)} mag/arcsec²
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sky Brightness:</Text>
              <Text style={styles.detailValue}>
                {item.median_brightness.toFixed(2)} DN
              </Text>
            </View>

            {item.sqm_moon_adjusted && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>SQM (Moon Adjusted):</Text>
                <Text style={styles.detailValue}>
                  {item.sqm_moon_adjusted.toFixed(2)} mag/arcsec²
                </Text>
              </View>
            )}

            {item.moon_data && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Moon Phase:</Text>
                  <Text style={styles.detailValue}>
                    {item.moon_data.phase} (
                    {item.moon_data.illumination.toFixed(1)}%)
                  </Text>
                </View>

                {item.moon_data.altitude !== null && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Moon Altitude:</Text>
                    <Text style={styles.detailValue}>
                      {item.moon_data.altitude.toFixed(1)}°
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Moon Impact:</Text>
                  <Text style={styles.detailValue}>
                    {item.moon_data.impact_description} (
                    {item.moon_data.impact_magnitude.toFixed(2)} mag)
                  </Text>
                </View>
              </>
            )}

            {item.location && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Latitude:</Text>
                  <Text style={styles.detailValue}>
                    {item.location.latitude.toFixed(6)}°
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Longitude:</Text>
                  <Text style={styles.detailValue}>
                    {item.location.longitude.toFixed(6)}°
                  </Text>
                </View>

                {item.location.altitude !== null && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Altitude:</Text>
                    <Text style={styles.detailValue}>
                      {item.location.altitude.toFixed(1)}m
                    </Text>
                  </View>
                )}

                {item.location.accuracy !== null && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>GPS Accuracy:</Text>
                    <Text style={styles.detailValue}>
                      ±{item.location.accuracy.toFixed(1)}m
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID:</Text>
              <Text style={[styles.detailValue, styles.detailValueSmall]}>
                {item.id}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyTableBody}>
        <Text style={styles.emptyText}>No measurements yet</Text>
        <Text style={styles.emptySubtext}>
          Take some sky quality meter readings to see them appear here
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.headerCell}>
        <Text style={styles.headerText}>Date</Text>
      </View>
      <View style={styles.headerCellSqm}>
        <Text style={styles.headerText}>SQM</Text>
      </View>
      <View style={styles.headerCellLocation}>
        <Text style={styles.headerText}>Location</Text>
      </View>
      <View style={styles.headerCellDelete}>
        <Text style={styles.headerText}></Text>
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
          ListHeaderComponent={renderHeader}
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
    paddingBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#1a0000",
    borderBottomWidth: 2,
    borderBottomColor: "#ff0000",
  },
  headerCell: {
    flex: 3,
    paddingRight: 8,
  },
  headerCellSqm: {
    flex: 1,
    alignItems: "center",
  },
  headerCellLocation: {
    flex: 2,
    paddingRight: 8,
  },
  headerCellDelete: {
    width: 32,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ff0000",
    textTransform: "uppercase",
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: 20,
    marginBottom: 20,
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
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
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
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ff0000",
    backgroundColor: "#000000",
  },
  rowContent: {
    marginBottom: 10,
  },
  cell: {
    flex: 3,
    paddingRight: 8,
  },
  cellSqm: {
    flex: 1,
    alignItems: "center",
  },
  cellLocation: {
    flex: 2,
    paddingRight: 8,
  },
  cellLabel: {
    fontSize: 12,
    color: "#ff0000",
    opacity: 0.7,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 12,
    color: "#ff0000",
  },
  cellValueSmall: {
    fontSize: 11,
    color: "#ff0000",
  },
  sqmValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff0000",
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ff0000",
    borderRadius: 16,
  },
  deleteButtonText: {
    color: "#ff0000",
    fontSize: 20,
    fontWeight: "bold",
    position: "relative",
    top: -4,
  },
  expandIndicator: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  expandIcon: {
    color: "#ff0000",
    fontSize: 12,
  },
  expandedPanel: {
    backgroundColor: "#0a0000",
    borderTopWidth: 1,
    borderTopColor: "#ff0000",
    borderBottomWidth: 2,
    borderBottomColor: "#ff0000",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: "#ff0000",
    opacity: 0.7,
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: "#ff0000",
    flex: 2,
    textAlign: "right",
  },
  detailValueLarge: {
    fontSize: 16,
    fontWeight: "bold",
  },
  detailValueSmall: {
    fontSize: 10,
    opacity: 0.8,
  },
});
