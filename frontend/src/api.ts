import axios from 'axios';
import type { User, Item, BuyResponse, LeaderboardEntry } from './types';

const api = axios.create({ baseURL: '/api' });

export async function registerUser(username: string): Promise<User> {
    const { data } = await api.post<User>('/register', { username });
    return data;
}

export async function fetchMe(userId: string): Promise<User> {
    const { data } = await api.get<User>(`/me/${userId}`);
    return data;
}

export async function fetchItems(): Promise<Item[]> {
    const { data } = await api.get<Item[]>('/items');
    return data;
}

export async function buyItem(userId: string, itemId: number): Promise<BuyResponse> {
    const { data } = await api.post<BuyResponse>('/buy', {
        user_id: userId,
        item_id: itemId,
    });
    return data;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data } = await api.get<LeaderboardEntry[]>('/leaderboard');
    return data;
}
