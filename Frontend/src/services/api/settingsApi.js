import client from './client';

export const settingsApi = {
    getPolicy: () => client.get('/api/settings'),
    updatePolicy: (data) => client.put('/api/settings', data)
};
