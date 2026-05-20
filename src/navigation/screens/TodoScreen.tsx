import { StaticScreenProps, useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { api, getErrorMessage, Todo, TodoList } from '../../services/api';

type Props = StaticScreenProps<{
  listId: number;
}>;

type TodoFormState = {
  visible: boolean;
  mode: 'add' | 'edit';
  value: string;
  todo?: Todo;
};

const emptyForm: TodoFormState = {
  visible: false,
  mode: 'add',
  value: '',
};

function isTodoDone(todo: Todo) {
  return todo.is_done === true || todo.is_done === 1;
}

export function TodoScreen({ route }: Props) {
  const navigation = useNavigation();
  const [list, setList] = useState<TodoList | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<TodoFormState>(emptyForm);

  const todos = list?.todos ?? list?.todo_items ?? [];

  const loadList = useCallback(async () => {
    try {
      setError('');
      const nextList = await api.getTodoList(route.params.listId);
      setList(nextList);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [route.params.listId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadList();
    }, [loadList]),
  );

  function openAddModal() {
    setForm({ visible: true, mode: 'add', value: '' });
  }

  function openEditModal(todo: Todo) {
    setForm({ visible: true, mode: 'edit', value: todo.description, todo });
  }

  async function saveTodo() {
    const description = form.value.trim();

    if (!description) {
      setError('Please enter a todo description.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (form.mode === 'edit' && form.todo) {
        await api.updateTodo(form.todo.id, { description });
      } else {
        await api.createTodo(route.params.listId, description);
      }

      setForm(emptyForm);
      await loadList();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleTodo(todo: Todo) {
    try {
      setError('');
      await api.updateTodo(todo.id, { is_done: !isTodoDone(todo) });
      await loadList();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteTodo(id: number) {
    try {
      setError('');
      await api.deleteTodo(id);
      await loadList();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={openAddModal}>
          <Text style={styles.primaryButtonText}>Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading todos...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>{list?.name ?? 'Todo List'}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FlatList
            data={todos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={todos.length === 0 ? styles.emptyList : styles.list}
            ListEmptyComponent={<Text style={styles.muted}>No todos yet. Add one to begin.</Text>}
            renderItem={({ item }) => {
              const done = isTodoDone(item);

              return (
                <View style={styles.todoRow}>
                  <Pressable style={styles.checkbox} onPress={() => toggleTodo(item)}>
                    <Text style={styles.checkboxText}>{done ? '✓' : ''}</Text>
                  </Pressable>
                  <Text style={[styles.todoDescription, done && styles.todoDone]}>
                    {item.description}
                  </Text>
                  <View style={styles.rowActions}>
                    <Pressable style={styles.secondaryButton} onPress={() => openEditModal(item)}>
                      <Text style={styles.secondaryButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.deleteButton} onPress={() => deleteTodo(item.id)}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      <Modal transparent animationType="fade" visible={form.visible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {form.mode === 'edit' ? 'Edit todo' : 'New todo'}
            </Text>
            <TextInput
              autoFocus
              value={form.value}
              onChangeText={(value) => setForm((current) => ({ ...current, value }))}
              placeholder="Todo description"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setForm(emptyForm)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={saveTodo} disabled={saving}>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
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
  todoRow: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#2563eb',
    borderRadius: 6,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkboxText: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '700',
  },
  todoDescription: {
    color: '#111827',
    flex: 1,
    fontSize: 16,
  },
  todoDone: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
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
  backButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#111827',
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
