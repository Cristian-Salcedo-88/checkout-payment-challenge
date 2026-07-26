import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import checkoutReducer from '../features/checkout/checkoutSlice';
import paymentReducer from '../features/payment/paymentSlice';
import productReducer from '../features/product/productSlice';

import localStorageEngine from './localStorageEngine';

const rootReducer = combineReducers({
  product: productReducer,
  checkout: checkoutReducer,
  payment: paymentReducer,
});

// None of these slices ever hold the raw card number or CVV — that stays in
// local component state inside the card form and is discarded as soon as it
// is tokenized against the payment provider. Only the resulting token +
// display-safe metadata (brand, last 4) reach the store, so persisting these
// three reducers wholesale to localStorage is safe. See checkoutSlice for
// details.
const persistConfig = {
  key: 'wompy-checkout',
  storage: localStorageEngine,
  whitelist: ['product', 'checkout', 'payment'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
