import axios from 'axios';

export type Todo = {
  id: number;
  description: string;
  is_done: boolean | number;
  todo_list_id?: number;
};

export type TodoList = {
  id: number;
  name: string;
  todos?: Todo[];
  todo_items?: Todo[];
};

const client = axios.create({
  baseURL: 'http://10.0.2.2:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

function unwrap<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data: unknown }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;

    if (typeof responseMessage === 'string') {
      return responseMessage;
    }

    if (error.message) {
      return error.message;
    }
  }

  return 'Something went wrong. Please try again.';
}

export const api = {
  async getTodoLists() {
    const response = await client.get('/todo-lists');
    return unwrap<TodoList[]>(response.data);
  },

  async createTodoList(name: string) {
    const response = await client.post('/todo-lists', { name });
    return unwrap<TodoList>(response.data);
  },

  async getTodoList(id: number) {
    const response = await client.get(`/todo-lists/${id}`);
    return unwrap<TodoList>(response.data);
  },

  async updateTodoList(id: number, name: string) {
    const response = await client.patch(`/todo-lists/${id}`, { name });
    return unwrap<TodoList>(response.data);
  },

  async deleteTodoList(id: number) {
    await client.delete(`/todo-lists/${id}`);
  },

  async getTodos() {
    const response = await client.get('/todos');
    return unwrap<Todo[]>(response.data);
  },

  async createTodo(todoListId: number, description: string) {
    const response = await client.post('/todos', {
      todo_list_id: todoListId,
      description,
      is_done: false,
    });
    return unwrap<Todo>(response.data);
  },

  async getTodo(id: number) {
    const response = await client.get(`/todos/${id}`);
    return unwrap<Todo>(response.data);
  },

  async updateTodo(id: number, values: Partial<Pick<Todo, 'description' | 'is_done'>>) {
    const response = await client.patch(`/todos/${id}`, values);
    return unwrap<Todo>(response.data);
  },

  async deleteTodo(id: number) {
    await client.delete(`/todos/${id}`);
  },
};
