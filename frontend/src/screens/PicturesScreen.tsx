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

export default function PicturesScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await journalService.getAll();
      // Filter entries that have images
      const entriesWithImages = data.filter(entry => entry.images && entry.images.length > 0);
      setEntries(entriesWithImages);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
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
        <Text style={styles.headerText}>Memories 📸</Text>
        
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>No pictures yet</Text>
            <Text style={styles.emptySubtext}>
              Add images to your journal entries to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.picturesContainer}>
            {entries.map((entry) => (
              <TouchableOpacity key={entry.id} style={styles.pictureCard}>
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>📸</Text>
                  <Text style={styles.imageCount}>
                    {entry.images?.length || 0} image{entry.images?.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.pictureInfo}>
                  <Text style={styles.pictureTitle}>{entry.title}</Text>
                  <Text style={styles.pictureDate}>{formatDate(entry.entry_date)}</Text>
                </View>
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
  picturesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pictureCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#FEC7D7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 60,
    marginBottom: 10,
  },
  imageCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  pictureInfo: {
    padding: 16,
  },
  pictureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pictureDate: {
    fontSize: 14,
    color: '#999',
  },
});
