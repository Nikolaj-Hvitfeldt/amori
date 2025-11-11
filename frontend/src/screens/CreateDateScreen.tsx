import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { journalService } from '../services/api';
import { CreateJournalEntry } from '../types/journal';

interface CreateDateScreenProps {
  onClose: () => void;
  onDateCreated: () => void;
}

export default function CreateDateScreen({ onClose, onDateCreated }: CreateDateScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };



  const handleDateChange = (value: string) => {
    const newDate = new Date(value);
    setSelectedDate(newDate);
  };

  const handleSaveDate = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter a title for your date.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter a description for your date.');
      return;
    }

    setLoading(true);
    
    try {
      // Create enriched content that includes the metadata for now
      const enrichedContent = `${description.trim()}

📅 Date: ${formatDateForInput(selectedDate)}
${location.trim() ? `📍 Location: ${location.trim()}` : ''}
${rating > 0 ? `⭐ Rating: ${'⭐'.repeat(rating)}` : ''}
${tags.trim() ? `🏷️ Tags: ${tags.split(',').map(tag => `#${tag.trim()}`).join(' ')}` : ''}`;

      const dateEntry: CreateJournalEntry = {
        title: title.trim(),
        content: enrichedContent,
        entry_type: 'date' as const,
        entry_date: formatDateForInput(selectedDate),
      };

      await journalService.create(dateEntry);
      
      // Refresh the list immediately after successful creation
      onDateCreated();
      
      Alert.alert(
        'Date Saved! 💕',
        'Your special date has been added to your memories.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving date:', error);
      Alert.alert('Error', 'Failed to save your date. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        <Text style={styles.ratingLabel}>How was it? </Text>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[styles.star, { color: star <= rating ? '#FFD700' : '#DDD' }]}>
              ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Date Entry</Text>
          <TouchableOpacity 
            onPress={handleSaveDate} 
            style={[styles.saveButton, { opacity: loading ? 0.6 : 1 }]}
            disabled={loading}
          >
            <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., First Coffee Date, Anniversary Dinner..."
              placeholderTextColor="#999"
            />
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.textInput}
              value={formatDateForInput(selectedDate)}
              onChangeText={handleDateChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Where did it happen?"
              placeholderTextColor="#999"
            />
          </View>

          {/* Rating */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rating</Text>
            {renderStars()}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell the story of this special date... What happened? How did it make you feel?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.textInput}
              value={tags}
              onChangeText={setTags}
              placeholder="romantic, dinner, surprise, anniversary (comma-separated)"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FEC7D7',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B9D',
  },
  saveButton: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FEC7D7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FEC7D7',
    borderRadius: 12,
    padding: 16,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 12,
  },
  starButton: {
    marginHorizontal: 2,
  },
  star: {
    fontSize: 24,
  },
});