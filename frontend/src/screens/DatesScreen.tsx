import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { journalService } from '../services/api';
import { JournalEntry } from '../types/journal';

export default function DatesScreen() {
  const [dates, setDates] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDates();
  }, []);

  const loadDates = async () => {
    try {
      const data = await journalService.getByType('date');
      setDates(data);
    } catch (error) {
      console.error('Error loading dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.headerText}>Special Dates 📅</Text>
        
        {dates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyText}>No special dates yet</Text>
            <Text style={styles.emptySubtext}>
              Record your anniversaries, first dates, and special moments
            </Text>
          </View>
        ) : (
          <View style={styles.datesContainer}>
            {dates.map((date) => (
              <TouchableOpacity key={date.id} style={styles.dateCard}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateIcon}>📅</Text>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateTitle}>{date.title}</Text>
                    <Text style={styles.dateDate}>{formatDate(date.entry_date)}</Text>
                  </View>
                </View>
                <Text style={styles.dateContent}>{date.content}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
  },
  scrollView: {
    flex: 1,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B9D',
    textAlign: 'center',
    marginVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  datesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateDate: {
    fontSize: 14,
    color: '#FF6B9D',
  },
  dateContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
