import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { journalService } from '../services/api';
import { JournalEntry } from '../types/journal';

export default function HomeScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await journalService.getAll();
      // Ensure data is an array, fallback to empty array if not
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading entries:', error);
      // Set empty array on error to prevent crashes
      setEntries([]);
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

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'lovestory': return '💕';
      case 'date': return '📅';
      case 'milestone': return '⭐';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Loading your memories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.headerText}>Our Journey Together</Text>
        
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💝</Text>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>
              Start documenting your beautiful journey together!
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {entries.map((entry, index) => (
              <View key={entry.id} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <Text style={styles.entryIcon}>{getEntryIcon(entry.entry_type)}</Text>
                </View>
                {index !== entries.length - 1 && <View style={styles.timelineLine} />}
                
                <TouchableOpacity style={styles.entryCard}>
                  <Text style={styles.entryDate}>{formatDate(entry.entry_date)}</Text>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text style={styles.entryType}>{entry.entry_type}</Text>
                  <Text style={styles.entryContent} numberOfLines={2}>
                    {entry.content}
                  </Text>
                </TouchableOpacity>
              </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  timeline: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 20,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEC7D7',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  entryIcon: {
    fontSize: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: 24,
    top: 60,
    width: 2,
    height: '100%',
    backgroundColor: '#FEC7D7',
    zIndex: 1,
  },
  entryCard: {
    marginLeft: 70,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  entryType: {
    fontSize: 12,
    color: '#FF6B9D',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
