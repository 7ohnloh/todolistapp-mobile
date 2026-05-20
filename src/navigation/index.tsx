import {
  createStaticNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ListsScreen } from './screens/ListsScreen';
import { NotFound } from './screens/NotFound';
import { TodoScreen } from './screens/TodoScreen';

const RootStack = createNativeStackNavigator({
  screens: {
    Lists: {
      screen: ListsScreen,
      options: {
        title: 'Todo Lists',
      },
    },
    Todo: {
      screen: TodoScreen,
      options: {
        title: 'Todos',
      },
    },
    NotFound: {
      screen: NotFound,
      options: {
        title: '404',
      },
      linking: {
        path: '*',
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackType = typeof RootStack;

declare module '@react-navigation/core' {
  interface RootNavigator extends RootStackType {}
}
