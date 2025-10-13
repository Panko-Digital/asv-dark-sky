import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";

interface MeasurementData {
  sky_quality_meter: number;
  sky_quality_meter_moon_adjusted?: number;
  bortle_class: number;
  bortle_description: string;
  additional_measurements: {
    naked_eye_limiting_magnitude: number;
    luminance_cd_m2: number;
    luminance_mcd_m2: number;
    light_pollution_level: string;
    astronomy_quality: string;
  };
  moon_data?: {
    phase: string;
    illumination: number;
    altitude: number | null;
    impact_magnitude: number;
    impact_description: string;
  };
}

interface MeasurementResultsProps {
  data: MeasurementData;
}

type TabType = "primary" | "scales" | "technical" | "moon";

const MeasurementResults: React.FC<MeasurementResultsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>("primary");

  const tabs = [
    { id: "primary" as TabType, label: "Results" },
    { id: "scales" as TabType, label: "Scales" },
    { id: "technical" as TabType, label: "Technical" },
    { id: "moon" as TabType, label: "Moon" },
  ];

  const renderPrimaryTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.mainResult}>
        <Text style={styles.mainLabel}>Sky Quality</Text>
        <Text style={styles.mainValue}>
          {data.sky_quality_meter.toFixed(2)} mag/arcsec²
        </Text>
        {data.sky_quality_meter_moon_adjusted && (
          <Text style={styles.adjustedValue}>
            {data.sky_quality_meter_moon_adjusted.toFixed(2)} (moon adjusted)
          </Text>
        )}
      </View>

      <View style={styles.resultGrid}>
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Bortle Class</Text>
          <Text style={styles.resultValue}>{data.bortle_class}</Text>
          <Text style={styles.resultDescription}>
            {data.bortle_description}
          </Text>
        </View>

        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Quality</Text>
          <Text style={styles.resultValue}>
            {data.additional_measurements.astronomy_quality}
          </Text>
          <Text style={styles.resultDescription}>
            {data.additional_measurements.light_pollution_level} light pollution
          </Text>
        </View>
      </View>
    </View>
  );

  const renderScalesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.dataTable}>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>SQM Reading</Text>
          <Text style={styles.tableValue}>
            {data.sky_quality_meter.toFixed(2)} mag/arcsec²
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Moon Adjusted</Text>
          <Text style={styles.tableValue}>
            {data.sky_quality_meter_moon_adjusted
              ? `${data.sky_quality_meter_moon_adjusted.toFixed(2)} mag/arcsec²`
              : "—"}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Bortle Scale</Text>
          <Text style={styles.tableValue}>Class {data.bortle_class}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>NELM</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.naked_eye_limiting_magnitude.toFixed(
              1
            )}{" "}
            mag
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Sky Luminance</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.luminance_mcd_m2.toFixed(3)} mcd/m²
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Pollution Level</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.light_pollution_level}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Astronomy Quality</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.astronomy_quality}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderTechnicalTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.dataTable}>
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Sky Luminance (cd/m²)</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.luminance_cd_m2.toFixed(6)} cd/m²
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Sky Luminance (mcd/m²)</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.luminance_mcd_m2.toFixed(3)} mcd/m²
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>NELM Estimate</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.naked_eye_limiting_magnitude.toFixed(
              1
            )}{" "}
            magnitude
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Bortle Classification</Text>
          <Text style={styles.tableValue}>Class {data.bortle_class}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Sky Description</Text>
          <Text style={styles.tableValue}>{data.bortle_description}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Light Pollution</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.light_pollution_level}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Observation Quality</Text>
          <Text style={styles.tableValue}>
            {data.additional_measurements.astronomy_quality}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderMoonTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {data.moon_data ? (
        <View style={styles.dataTable}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Moon Phase</Text>
            <Text style={styles.tableValue}>{data.moon_data.phase}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Illumination</Text>
            <Text style={styles.tableValue}>
              {(data.moon_data.illumination * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Altitude</Text>
            <Text style={styles.tableValue}>
              {data.moon_data.altitude !== null
                ? `${data.moon_data.altitude.toFixed(1)}°`
                : "—"}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Sky Impact</Text>
            <Text style={styles.tableValue}>
              {data.moon_data.impact_magnitude.toFixed(2)} mag
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Impact Description</Text>
            <Text style={styles.tableValue}>
              {data.moon_data.impact_description}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Adjusted SQM</Text>
            <Text style={styles.tableValue}>
              {data.sky_quality_meter_moon_adjusted
                ? `${data.sky_quality_meter_moon_adjusted.toFixed(
                    2
                  )} mag/arcsec²`
                : "—"}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Original SQM</Text>
            <Text style={styles.tableValue}>
              {data.sky_quality_meter.toFixed(2)} mag/arcsec²
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>No moon data available</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "primary":
        return renderPrimaryTab();
      case "scales":
        return renderScalesTab();
      case "technical":
        return renderTechnicalTab();
      case "moon":
        return renderMoonTab();
      default:
        return renderPrimaryTab();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "transparent",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "#ff0000",
  },
  tabText: {
    color: "#888888",
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  tabContent: {
    minHeight: 200,
  },
  mainResult: {
    alignItems: "center",
    marginBottom: 24,
  },
  mainLabel: {
    color: "#bbbbbb",
    fontSize: 16,
    marginBottom: 8,
  },
  mainValue: {
    color: "#ff0000",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  adjustedValue: {
    color: "#888888",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  resultGrid: {
    flexDirection: "row",
    gap: 16,
  },
  resultItem: {
    flex: 1,
    alignItems: "center",
  },
  resultLabel: {
    color: "#bbbbbb",
    fontSize: 12,
    marginBottom: 4,
  },
  resultValue: {
    color: "#ff0000",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  resultDescription: {
    color: "#888888",
    fontSize: 10,
    textAlign: "center",
  },
  dataTable: {
    gap: 8,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(26, 26, 26, 0.5)",
    borderRadius: 6,
  },
  tableLabel: {
    color: "#bbbbbb",
    fontSize: 14,
    flex: 1,
  },
  tableValue: {
    color: "#ff0000",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  noData: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noDataText: {
    color: "#888888",
    fontSize: 16,
  },
});

export default MeasurementResults;
