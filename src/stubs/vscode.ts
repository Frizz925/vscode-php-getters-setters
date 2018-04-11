export const window = {
    activeTextEditor: {
        document: {
            languageId: 'php'
        }
    }
};

export const workspace = {
    getConfiguration() {
        return config;
    }
};

const config = {
    get(name: string, defaultValue?: any) {
        return defaultValue;
    }
};
