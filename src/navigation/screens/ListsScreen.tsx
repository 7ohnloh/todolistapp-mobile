import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, getErrorMessage, TodoList } from '../../services/api';

type ListFormState = {
  visible: boolean;
  mode: 'add' | 'edit';
  value: string;
  list?: TodoList;
};

const emptyForm: ListFormState = {
  visible: false,
  mode: 'add',
  value: '',
};

export function ListsScreen() {
  const navigation = useNavigation();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ListFormState>(emptyForm);

  const loadLists = useCallback(async () => {
    try {
      setError('');
      const nextLists = await api.getTodoLists();
      setLists(nextLists);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLists();
    }, [loadLists]),
  );

  function openAddModal() {
    setForm({ visible: true, mode: 'add', value: '' });
  }

  function openEditModal(list: TodoList) {
    setForm({ visible: true, mode: 'edit', value: list.name, list });
  }

  async function saveList() {
    const name = form.value.trim();

    if (!name) {
      setError('Please enter a list name.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (form.mode === 'edit' && form.list) {
        await api.updateTodoList(form.list.id, name);
      } else {
        await api.createTodoList(name);
      }

      setForm(emptyForm);
      await loadLists();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteList(id: number) {
    try {
      setError('');
      await api.deleteTodoList(id);
      setLists((currentLists) => currentLists.filter((list) => list.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Todo Lists</Text>
          <Text style={styles.subtitle}>Internship, Exchange, School, and your own lists</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={openAddModal}>
          <Text style={styles.primaryButtonText}>Add</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading lists...</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={lists.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={<Text style={styles.muted}>No todo lists yet. Add one to begin.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.listRow}
              onPress={() => navigation.navigate('Todo', { listId: item.id })}
            >
              <View style={styles.listTextWrap}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.muted}>
                  {(item.todos ?? item.todo_items ?? []).length} todos
                </Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable style={styles.secondaryButton} onPress={() => openEditModal(item)}>
                  <Text style={styles.secondaryButtonText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={() => deleteList(item.id)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal transparent animationType="fade" visible={form.visible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {form.mode === 'edit' ? 'Edit list' : 'New list'}
            </Text>
            <TextInput
              autoFocus
              value={form.value}
              onChangeText={(value) => setForm((current) => ({ ...current, value }))}
              placeholder="List name"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setForm(emptyForm)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={saveList} disabled={saving}>
                <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 4,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRow: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  listTextWrap: {
    flex: 1,
  },
  listName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '600',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  muted: {
    color: '#6b7280',
  },
  error: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    color: '#991b1b',
    marginBottom: 12,
    padding: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#3730a3',
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#991b1b',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    padding: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
