window.FilesAPI = {
    uploadSingle: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('authToken');
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API.baseUrl}/files/upload_single`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Upload failed');
        }

        return await response.json();
    }
};
