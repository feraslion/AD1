#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-accounting-erp}"

mkdir -p "$ROOT_DIR"
cd "$ROOT_DIR"

mkdir -p \
  apps/mobile/src/app/navigation \
  apps/mobile/src/app/providers \
  apps/mobile/src/app/store \
  apps/mobile/src/app/bootstrap \
  apps/mobile/src/features/auth/screens \
  apps/mobile/src/features/auth/components \
  apps/mobile/src/features/auth/services \
  apps/mobile/src/features/auth/store \
  apps/mobile/src/features/gl/screens \
  apps/mobile/src/features/gl/components \
  apps/mobile/src/features/gl/services \
  apps/mobile/src/features/gl/store \
  apps/mobile/src/features/sales/screens \
  apps/mobile/src/features/sales/components \
  apps/mobile/src/features/sales/services \
  apps/mobile/src/features/sales/store \
  apps/mobile/src/features/purchases/screens \
  apps/mobile/src/features/purchases/components \
  apps/mobile/src/features/purchases/services \
  apps/mobile/src/features/purchases/store \
  apps/mobile/src/features/inventory/screens \
  apps/mobile/src/features/inventory/components \
  apps/mobile/src/features/inventory/services \
  apps/mobile/src/features/inventory/store \
  apps/mobile/src/features/reports/screens \
  apps/mobile/src/features/reports/services \
  apps/mobile/src/features/reports/store \
  apps/mobile/src/features/settings/screens \
  apps/mobile/src/features/settings/store \
  apps/mobile/src/features/communication/screens \
  apps/mobile/src/features/communication/services \
  apps/mobile/src/features/communication/store \
  apps/mobile/src/features/tools/screens \
  apps/mobile/src/features/cloud/screens \
  apps/mobile/src/features/cloud/services \
  apps/mobile/src/features/cloud/store \
  apps/mobile/src/features/sync/services \
  apps/mobile/src/features/sync/store \
  apps/mobile/src/components/ui \
  apps/mobile/src/components/shared \
  apps/mobile/src/services/api \
  apps/mobile/src/services/storage \
  apps/mobile/src/services/print \
  apps/mobile/src/services/network \
  apps/mobile/src/hooks \
  apps/mobile/src/utils \
  apps/mobile/src/theme \
  apps/mobile/src/i18n \
  apps/mobile/src/types \
  apps/mobile/__tests__ \
  apps/api/src/common/prisma \
  apps/api/src/common/guards \
  apps/api/src/common/decorators \
  apps/api/src/common/interceptors \
  apps/api/src/common/filters \
  apps/api/src/common/dto \
  apps/api/src/modules/auth \
  apps/api/src/modules/users \
  apps/api/src/modules/roles \
  apps/api/src/modules/audit \
  apps/api/src/modules/sync \
  apps/api/src/modules/ledger \
  apps/api/src/modules/sales \
  apps/api/src/modules/purchases \
  apps/api/src/modules/inventory \
  apps/api/src/modules/reports \
  apps/api/src/modules/settings \
  apps/api/src/config \
  apps/api/src/utils \
  apps/api/prisma/migrations \
  apps/api/test \
  apps/api/test-utils \
  packages/core/src/accounting \
  packages/core/src/inventory \
  packages/core/src/sales \
  packages/core/src/fx \
  packages/core/src/communication \
  packages/types/src \
  packages/ui/src/components/Button \
  packages/ui/src/components/Input \
  packages/ui/src/components/Card \
  packages/ui/src/components/Modal \
  packages/ui/src/components/Badge \
  packages/ui/src/theme \
  packages/config/eslint \
  packages/config/tsconfig \
  packages/config/prettier \
  docs \
  scripts \
  .github/workflows \
  .vscode

cat > package.json <<'EOF'
{
  "name": "accounting-erp",
  "private": true,
  "packageManager": "pnpm@9.12.3",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "format": "prettier --write .",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "latest",
    "eslint": "latest",
    "prettier": "latest",
    "dotenv": "latest",
    "husky": "latest",
    "lint-staged": "latest"
  }
}
EOF

cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

cat > turbo.json <<'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
EOF

cat > tsconfig.base.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@erp/core": ["packages/core/src/index.ts"],
      "@erp/core/*": ["packages/core/src/*"],
      "@erp/types": ["packages/types/src/index.ts"],
      "@erp/types/*": ["packages/types/src/*"],
      "@erp/ui": ["packages/ui/src/index.ts"],
      "@erp/ui/*": ["packages/ui/src/*"],
      "@erp/config/*": ["packages/config/*"],
      "@app/*": ["apps/mobile/src/*"]
    },
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
EOF

cat > .env.example <<'EOF'
API_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accounting_erp
JWT_SECRET=change_me
APP_BASE_URL=accountingerp://
EOF

cat > .gitignore <<'EOF'
node_modules
dist
build
coverage
.expo
.expo-shared
.env
.DS_Store
*.log
EOF

cat > .editorconfig <<'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
EOF

cat > README.md <<'EOF'
# Accounting ERP

ERP محاسبي مؤسسي متعدد اللغات والعملات مبني على Expo + NestJS + Monorepo.
EOF

cat > apps/mobile/package.json <<'EOF'
{
  "name": "mobile",
  "private": true,
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "dev": "expo start",
    "build": "expo export",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "jest",
    "clean": "rm -rf .expo .expo-shared coverage"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "react-native-screens": "^4.5.0",
    "react-native-safe-area-context": "^4.12.0",
    "react-native-gesture-handler": "^2.20.0",
    "zustand": "^5.0.0",
    "react-native-mmkv": "^2.13.0",
    "expo-camera": "~16.0.0",
    "expo-file-system": "~18.0.0",
    "expo-print": "~14.0.0",
    "expo-sharing": "~12.0.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.0.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "typescript": "latest"
  }
}
EOF

cat > apps/mobile/app.json <<'EOF'
{
  "expo": {
    "name": "Accounting ERP",
    "slug": "accounting-erp",
    "scheme": "accountingerp"
  }
}
EOF

cat > apps/mobile/babel.config.js <<'EOF'
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"]
  };
};
EOF

cat > apps/mobile/metro.config.js <<'EOF'
const { getDefaultConfig } = require("expo/metro-config");
module.exports = getDefaultConfig(__dirname);
EOF

cat > apps/mobile/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["jest", "react-native"],
    "noEmit": true
  },
  "include": ["src", "App.tsx", "__tests__"]
}
EOF

cat > apps/mobile/jest.config.js <<'EOF'
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@erp/core(.*)$": "<rootDir>/../../packages/core/src$1",
    "^@erp/types(.*)$": "<rootDir>/../../packages/types/src$1"
  }
};
EOF

cat > apps/mobile/jest.setup.ts <<'EOF'
import "react-native-gesture-handler/jestSetup";

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    delete: jest.fn()
  }))
}));
EOF

cat > apps/mobile/App.tsx <<'EOF'
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./src/app/navigation/RootNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
EOF

cat > apps/mobile/src/app/navigation/RootNavigator.tsx <<'EOF'
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();
const Placeholder = () => null;

export function RootNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={Placeholder} />
      <Tab.Screen name="Sales" component={Placeholder} />
      <Tab.Screen name="Inventory" component={Placeholder} />
      <Tab.Screen name="Reports" component={Placeholder} />
      <Tab.Screen name="Settings" component={Placeholder} />
    </Tab.Navigator>
  );
}
EOF

cat > apps/api/package.json <<'EOF'
{
  "name": "api",
  "private": true,
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "lint": "eslint src test --ext .ts",
    "test": "jest",
    "test:e2e": "jest --config jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@prisma/client": "^5.19.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.4.0",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "typescript": "latest",
    "prisma": "^5.19.0"
  }
}
EOF

cat > apps/api/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "CommonJS",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src", "test", "prisma"]
}
EOF

cat > apps/api/nest-cli.json <<'EOF'
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
EOF

cat > apps/api/jest.config.js <<'EOF'
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  testEnvironment: "node"
};
EOF

cat > apps/api/jest-e2e.json <<'EOF'
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
EOF

cat > apps/api/src/main.ts <<'EOF'
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
EOF

cat > apps/api/src/app.module.ts <<'EOF'
import { Module } from "@nestjs/common";

@Module({
  imports: []
})
export class AppModule {}
EOF

cat > apps/api/prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id           String    @id @default(cuid())
  name         String
  baseCurrency String
  createdAt    DateTime  @default(now())
  accounts     Account[]
  users        User[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      String
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id])
  createdAt DateTime @default(now())
}

model Account {
  id        String   @id @default(cuid())
  code      String
  name      String
  type      String
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
  createdAt DateTime @default(now())
}
EOF

cat > apps/api/prisma/seed.ts <<'EOF'
console.log("Seed not implemented yet");
EOF

cat > docs/architecture.md <<'EOF'
# Architecture

المشروع مبني كـ monorepo:
- apps/mobile
- apps/api
- packages/core
- packages/types
EOF

cat > .github/workflows/ci.yml <<'EOF'
name: CI
on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.12.3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
EOF

echo "Bootstrap V2 complete in: $ROOT_DIR"
