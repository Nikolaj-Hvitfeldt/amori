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

export default function StoriesScreen() {
  const [stories, setStories] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await journalService.getByType('lovestory');
      setStories(data);
    } catch (error) {
      console.error('Error loading stories:', error);
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
        <Text style={styles.headerText}>Love Stories 💕</Text>
        
        {stories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💌</Text>
            <Text style={styles.emptyText}>No love stories yet</Text>
            <Text style={styles.emptySubtext}>
              Share your favorite moments and memories together
            </Text>
          </View>
        ) : (
          <View style={styles.storiesContainer}>
            {stories.map((story) => (
              <TouchableOpacity key={story.id} style={styles.storyCard}>
                <Text style={styles.storyDate}>{formatDate(story.entry_date)}</Text>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyContent}>{story.content}</Text>
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
  storiesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  storyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
  },
  storyDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  storyContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
});
