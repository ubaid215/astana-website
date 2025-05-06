'use client'

import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableColHeader: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    backgroundColor: '#f0f0f0'
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5
  }
})

export const UserReportPDF = ({ participations }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>User Participations Report</Text>
      
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text>Collector Name</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text>WhatsApp Number</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text>Country</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text>Members</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text>Total Amount</Text>
          </View>
        </View>
        
        {/* Table Rows */}
        {participations.map((participation, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text>{participation.collectorName || '-'}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>{participation.whatsappNumber || '-'}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>{participation.country || '-'}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>{participation.members?.join(', ') || '-'}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>{participation.totalAmount?.toLocaleString() || '0'}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
)