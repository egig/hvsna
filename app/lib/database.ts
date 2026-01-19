import {
    createRxDatabase,
    addRxPlugin,
    type RxDatabase
} from 'rxdb';
import {
    getRxStorageLocalstorage
} from 'rxdb/plugins/storage-localstorage';
import {
    databaseSchema
} from './schema';

import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import React, { createContext, useContext, type ReactNode } from 'react';
let dbPromise: Promise<any> | null = null;
let currentDbConfig: DatabaseConfig | null = null;

export interface DatabaseConfig {
    name: string;
    storage?: any;
    schema?: any;
    devMode?: boolean;

}

const _create = async (config: DatabaseConfig = { name: 'hvsna', devMode: true }) => {
    if (config.devMode) {
        addRxPlugin(RxDBDevModePlugin);
    }

    const db = await createRxDatabase({
        name: config.name,
        storage: config.storage || wrappedValidateAjvStorage({ storage: getRxStorageLocalstorage() })
    });
    
    const schema = config.schema || databaseSchema;
    await db.addCollections(schema.collections);
    return db;
};

export const get = (config?: DatabaseConfig) => {
    if (!dbPromise || (config && JSON.stringify(config) !== JSON.stringify(currentDbConfig))) {
        dbPromise = _create(config);
        currentDbConfig = config || { name: 'hvsna' };
    }
    return dbPromise;
};

// Database Context
type DatabaseContextType = {
    db: RxDatabase | null;
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ 
    children, 
    db
}: { 
    children: ReactNode;
    db: RxDatabase | null;
}) => {
    return React.createElement(
        DatabaseContext.Provider,
        { value: { db } },
        children
    );
};

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (context === undefined) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return context;
};
