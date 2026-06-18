import * as fs from 'fs';
import * as path from 'path';
import { API_RESOURCES, APIResourceConfig } from '../../api-config';

// Find the workspace root by looking for the 'apps' directory
function findWorkspaceRoot(): string {
  let currentDir = __dirname;

  // Go up from apps/api/src/utils/scripts to find workspace root
  // Look for a marker like the 'apps' directory
  for (let i = 0; i < 6; i++) {
    const appsDir = path.join(currentDir, 'apps');
    if (fs.existsSync(appsDir)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find workspace root');
}

const WORKSPACE_ROOT = findWorkspaceRoot();
const PROJECT_ROOT = path.join(WORKSPACE_ROOT, 'apps/api');
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');
const CORE_ROOT = path.join(SRC_ROOT, 'core');
const DB_TYPES_PATH = path.join(
  WORKSPACE_ROOT,
  'apps/dashboard/src/lib/types/database.types.ts',
);

// Helper to convert snake_case to CamelCase
function toCamelCase(str: string, capitalizeFirst: boolean = false): string {
  const camel = str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  return capitalizeFirst
    ? camel.charAt(0).toUpperCase() + camel.slice(1)
    : camel;
}

// Helper to convert snake_case to kebab-case
function toKebabCase(str: string): string {
  return str.replace(/_/g, '-');
}

interface TableDefinition {
  properties: Record<string, string>;
}

function parseDatabaseTypes(): Record<string, TableDefinition> {
  const content = fs.readFileSync(DB_TYPES_PATH, 'utf8');
  const definitions: Record<string, TableDefinition> = {};

  // Extract Tables block
  const tablesBlockMatch = content.match(
    /Tables:\s*\{([\s\S]*?)\n\s{4}\}(?=\s*(?:Views|Functions|Enums))/,
  );
  let tablesBlock: string;
  if (!tablesBlockMatch) {
    // Fallback
    const fallbackMatch = content.match(/Tables:\s*\{([\s\S]*?)\n\s{4}\}/);
    if (!fallbackMatch) return {};
    tablesBlock = fallbackMatch[1];
  } else {
    tablesBlock = tablesBlockMatch[1];
  }

  // Split by table
  const tableRegex =
    /^\s{6}([a-z0-9_]+): \{[\s\S]*?Row: \{([\s\S]*?)\n\s{8}\}/gm;
  let match;

  while ((match = tableRegex.exec(tablesBlock)) !== null) {
    const tableName = match[1];
    const rowContent = match[2];
    const properties: Record<string, string> = {};

    // Parse properties
    // Example: account_id: string
    // Example: amount: number | null
    // Note: database.types.ts doesn't use semicolons at the end of lines
    const propRegex = /^\s{10}([a-z0-9_]+): (.*)$/gm;
    let propMatch;
    while ((propMatch = propRegex.exec(rowContent)) !== null) {
      properties[propMatch[1]] = propMatch[2].trim();
    }

    definitions[tableName] = { properties };
  }

  return definitions;
}

function generateDtoContent(
  className: string,
  properties: Record<string, string>,
  isUpdate = false,
): string {
  const imports = ["import { ApiProperty } from '@nestjs/swagger';"];
  const lines = [`export class ${className} {`];

  for (const [name, type] of Object.entries(properties)) {
    // Skip internal fields for CreateDTOs if needed, but for now we include all
    // We might want to exclude id, created_at, updated_at for CreateDTO

    let tsType = 'string';
    let example = "'string'";

    if (type.includes('number')) {
      tsType = 'number';
      example = '123';
    } else if (type.includes('boolean')) {
      tsType = 'boolean';
      example = 'true';
    } else if (type.includes('Json')) {
      tsType = 'any';
      example = '{}';
    }

    // Clean up type definition from DB types (remove nulls for DTOs or keep them?)
    // For simplicity, we'll just use the basic type

    if (isUpdate) {
      lines.push(`  @ApiProperty({ required: false, example: ${example} })`);
      lines.push(`  ${name}?: ${tsType};`);
    } else {
      lines.push(`  @ApiProperty({ example: ${example} })`);
      lines.push(`  ${name}: ${tsType};`);
    }
    lines.push('');
  }

  lines.push('}');
  return imports.join('\n') + '\n\n' + lines.join('\n');
}

function generateServiceContent(
  className: string,
  tableName: string,
  dtoName: string,
  updateDtoName: string,
  responseDtoName: string,
  idField: string,
  properties: Record<string, string>,
  operations: APIResourceConfig['operations'],
): string {
  const hasOrganizationId = 'organization_id' in properties;
  const hasMerchantId = 'merchant_id' in properties;
  const hasCreatedBy = 'created_by' in properties; // Sometimes used as merchant_id
  const hasTenancy = hasOrganizationId || hasMerchantId || hasCreatedBy;

  let insertAugmentation = '';

  if (hasOrganizationId) {
    insertAugmentation = `organization_id: user.organizationId,`;
  } else if (hasMerchantId) {
    insertAugmentation = `merchant_id: user.merchantId,`;
  } else if (hasCreatedBy) {
    insertAugmentation = `created_by: user.merchantId,`;
  }

  // Use _user prefix if no tenancy filter exists
  const userParam = hasTenancy ? 'user' : '_user';

  const singularName = tableName.endsWith('s')
    ? tableName.slice(0, -1)
    : tableName;
  const kebabSingular = toKebabCase(singularName);
  const createRpcName = `create_${singularName}`;
  const listRpcName = `list_${tableName}`;
  const getRpcName = `get_${singularName}`;
  const updateRpcName = `update_${singularName}`;
  const deleteRpcName = `delete_${singularName}`;

  const imports = [
    `import { Injectable } from '@nestjs/common';`,
    `import { SupabaseService } from '../supabase/supabase.service';`,
  ];

  if (operations?.create) {
    imports.push(
      `import { ${dtoName} } from './dto/create-${kebabSingular}.dto';`,
    );
  }
  if (operations?.update) {
    imports.push(
      `import { ${updateDtoName} } from './dto/update-${kebabSingular}.dto';`,
    );
  }

  imports.push(
    `import { AuthContext } from '../../core/common/decorators/current-user.decorator';`,
  );

  const methods: string[] = [];

  // CREATE method
  if (operations?.create) {
    methods.push(`
  async create(createDto: ${dtoName}, ${userParam}: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      '${createRpcName}' as any,
      {
        ...createDto,
        ${insertAugmentation}
      } as any,
    );

    if (error) throw new Error(error.message);
    const rows = Array.isArray(data) ? data : [data];
    return rows[0];
  }`);
  }

  // LIST method
  if (operations?.list) {
    methods.push(`
  async findAll(${userParam}: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      '${listRpcName}' as any,
      {
        ${insertAugmentation}
      } as any,
    );

    if (error) throw new Error(error.message);
    return data || [];
  }`);
  }

  // GET method
  if (operations?.get) {
    methods.push(`
  async findOne(id: string, ${userParam}: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      '${getRpcName}' as any,
      {
        p_${idField}: id,
        ${insertAugmentation}
      } as any,
    );

    if (error) throw new Error(error.message);
    const rows = Array.isArray(data) ? data : [data];
    return rows[0];
  }`);
  }

  // UPDATE method
  if (operations?.update) {
    methods.push(`
  async update(id: string, updateDto: ${updateDtoName}, ${userParam}: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      '${updateRpcName}' as any,
      {
        p_${idField}: id,
        ...updateDto,
        ${insertAugmentation}
      } as any,
    );

    if (error) throw new Error(error.message);
    const rows = Array.isArray(data) ? data : [data];
    return rows[0];
  }`);
  }

  // DELETE method
  if (operations?.delete) {
    methods.push(`
  async remove(id: string, ${userParam}: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      '${deleteRpcName}' as any,
      {
        p_${idField}: id,
        ${insertAugmentation}
      } as any,
    );

    if (error) throw new Error(error.message);
    const rows = Array.isArray(data) ? data : [data];
    return rows[0];
  }`);
  }

  return `${imports.join('\n')}

@Injectable()
export class ${className} {
  constructor(private readonly supabase: SupabaseService) {}
${methods.join('\n')}
}
`;
}

function generateControllerContent(
  controllerName: string,
  serviceName: string,
  serviceFileName: string,
  tableName: string,
  dtoName: string,
  updateDtoName: string,
  responseDtoName: string,
  resource: APIResourceConfig,
): string {
  const singularName = tableName.endsWith('s')
    ? tableName.slice(0, -1)
    : tableName;
  const kebabSingular = toKebabCase(singularName);
  const operations = resource.operations || {};

  // Collect necessary imports based on operations
  const nestImports = ['Controller', 'UseGuards'];
  if (operations.create) nestImports.push('Post', 'Body');
  if (operations.list) nestImports.push('Get');
  if (operations.get && !operations.list) nestImports.push('Get');
  if (operations.get || operations.update || operations.delete)
    nestImports.push('Param');
  if (operations.update) nestImports.push('Patch', 'Body');
  if (operations.delete) nestImports.push('Delete');

  const imports = [
    `import { ${nestImports.join(', ')} } from '@nestjs/common';`,
    `import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';`,
    `import { ${serviceName} } from './${serviceFileName}';`,
  ];

  if (operations.create) {
    imports.push(
      `import { ${dtoName} } from './dto/create-${kebabSingular}.dto';`,
    );
  }
  if (operations.update) {
    imports.push(
      `import { ${updateDtoName} } from './dto/update-${kebabSingular}.dto';`,
    );
  }

  imports.push(
    `import { ${responseDtoName} } from './dto/${kebabSingular}-response.dto';`,
    `import { ApiKeyGuard } from '../../core/common/guards/api-key.guard';`,
    `import { CurrentUser, type AuthContext } from '../../core/common/decorators/current-user.decorator';`,
  );

  const methods: string[] = [];

  // CREATE endpoint
  if (operations.create) {
    methods.push(`
  @Post()
  @ApiOperation({ summary: 'Create a new ${singularName}' })
  @ApiResponse({
    status: 201,
    description: 'The ${singularName} has been successfully created.',
    type: ${responseDtoName},
  })
  create(@Body() createDto: ${dtoName}, @CurrentUser() user: AuthContext) {
    return this.service.create(createDto, user);
  }`);
  }

  // LIST endpoint
  if (operations.list) {
    methods.push(`
  @Get()
  @ApiOperation({ summary: 'List all ${tableName}' })
  @ApiResponse({
    status: 200,
    description: 'List of ${tableName}',
    type: [${responseDtoName}],
  })
  findAll(@CurrentUser() user: AuthContext) {
    return this.service.findAll(user);
  }`);
  }

  // GET endpoint
  if (operations.get) {
    methods.push(`
  @Get(':id')
  @ApiOperation({ summary: 'Get a ${singularName} by ID' })
  @ApiResponse({
    status: 200,
    description: 'The ${singularName}',
    type: ${responseDtoName},
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.service.findOne(id, user);
  }`);
  }

  // UPDATE endpoint
  if (operations.update) {
    methods.push(`
  @Patch(':id')
  @ApiOperation({ summary: 'Update a ${singularName}' })
  @ApiResponse({
    status: 200,
    description: 'The ${singularName} has been successfully updated.',
    type: ${responseDtoName},
  })
  update(@Param('id') id: string, @Body() updateDto: ${updateDtoName}, @CurrentUser() user: AuthContext) {
    return this.service.update(id, updateDto, user);
  }`);
  }

  // DELETE endpoint
  if (operations.delete) {
    methods.push(`
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ${singularName}' })
  @ApiResponse({
    status: 200,
    description: 'The ${singularName} has been successfully deleted.',
    type: ${responseDtoName},
  })
  remove(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.service.remove(id, user);
  }`);
  }

  return `${imports.join('\n')}

@ApiTags('${resource.tag || toCamelCase(tableName, true)}')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('${tableName}')
export class ${controllerName} {
  constructor(private readonly service: ${serviceName}) {}
${methods.join('\n')}
}
`;
}

function generateModuleContent(
  moduleName: string,
  controllerName: string,
  serviceName: string,
  controllerFileName: string,
  serviceFileName: string,
): string {
  return `import { Module } from '@nestjs/common';
import { ${controllerName} } from './${controllerFileName}';
import { ${serviceName} } from './${serviceFileName}';

@Module({
  controllers: [${controllerName}],
  providers: [${serviceName}],
})
export class ${moduleName} {}
`;
}

async function main() {
  console.log('🚀 Starting Module Generation...');

  const dbDefinitions = parseDatabaseTypes();
  console.log(
    `📊 Parsed ${Object.keys(dbDefinitions).length} table definitions.`,
  );

  for (const resource of API_RESOURCES) {
    if (!resource.enabled) continue;

    // SKIP - manually implemented with special logic
    if (
      resource.tableName === 'checkout_sessions' ||
      resource.tableName === 'webhooks' ||
      resource.tableName === 'accounts' ||
      resource.tableName === 'organizations' ||
      resource.tableName === 'customers' ||
      resource.tableName === 'discount_coupons' ||
      resource.tableName === 'transactions' ||
      resource.tableName === 'webhook_delivery_logs' ||
      resource.tableName === 'subscriptions' ||
      resource.tableName === 'products' ||
      resource.tableName === 'prices' ||
      resource.tableName === 'payment_links' ||
      resource.tableName === 'payment_requests' ||
      resource.tableName === 'payouts' ||
      resource.tableName === 'beneficiary_payouts' ||
      resource.tableName === 'refunds'
    ) {
      console.log(
        `⏩ Skipping ${resource.tableName} (manually implemented with special logic)`,
      );
      continue;
    }

    const tableName = resource.tableName;
    const singularName = tableName.endsWith('s')
      ? tableName.slice(0, -1)
      : tableName;
    const kebabName = toKebabCase(tableName);
    const kebabSingular = toKebabCase(singularName);
    const camelName = toCamelCase(tableName, true);
    const camelSingular = toCamelCase(singularName, true);

    const moduleName = `${camelName}Module`;
    const controllerName = `${camelName}Controller`;
    const serviceName = `${camelName}Service`;
    const dtoName = `Create${camelSingular}Dto`;
    const updateDtoName = `Update${camelSingular}Dto`;
    const responseDtoName = `${camelSingular}ResponseDto`;

    console.log(`\n📦 Generating module for ${tableName}...`);

    // 1. Ensure module directory exists
    const moduleDir = path.join(CORE_ROOT, kebabName);
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    // 2. Generate DTOs
    const dtoDir = path.join(CORE_ROOT, kebabName, 'dto');
    if (!fs.existsSync(dtoDir)) fs.mkdirSync(dtoDir, { recursive: true });

    const tableDef = dbDefinitions[tableName];
    if (!tableDef) {
      console.warn(
        `⚠️  No table definition found for ${tableName}. Generating empty DTOs.`,
      );
    }

    const properties = tableDef ? tableDef.properties : {};

    // Filter properties for CreateDTO (exclude id, created_at, updated_at)
    const createProperties = { ...properties };
    delete createProperties[resource.idField || 'id'];
    delete createProperties['created_at'];
    delete createProperties['updated_at'];
    delete createProperties['created_by']; // Usually handled by auth
    delete createProperties['organization_id']; // Usually handled by auth
    delete createProperties['merchant_id']; // Usually handled by auth

    // Generate CreateDTO if create operation is enabled
    if (resource.operations?.create) {
      const createDtoContent = generateDtoContent(dtoName, createProperties);
      fs.writeFileSync(
        path.join(dtoDir, `create-${kebabSingular}.dto.ts`),
        createDtoContent,
      );
    }

    // Generate UpdateDTO if update operation is enabled
    if (resource.operations?.update) {
      // For update DTO, make all fields optional
      const updateDtoContent = generateDtoContent(
        updateDtoName,
        createProperties,
        true,
      );
      fs.writeFileSync(
        path.join(dtoDir, `update-${kebabSingular}.dto.ts`),
        updateDtoContent,
      );
    }

    // Always generate ResponseDTO
    const responseDtoContent = generateDtoContent(responseDtoName, properties);
    fs.writeFileSync(
      path.join(dtoDir, `${kebabSingular}-response.dto.ts`),
      responseDtoContent,
    );

    // 3. Overwrite Service
    const serviceContent = generateServiceContent(
      serviceName,
      tableName,
      dtoName,
      updateDtoName,
      responseDtoName,
      resource.idField || 'id',
      properties,
      resource.operations,
    );
    fs.writeFileSync(
      path.join(CORE_ROOT, kebabName, `${kebabName}.service.ts`),
      serviceContent,
    );

    // 4. Overwrite Controller
    const controllerContent = generateControllerContent(
      controllerName,
      serviceName,
      `${kebabName}.service`,
      tableName,
      dtoName,
      updateDtoName,
      responseDtoName,
      resource,
    );
    fs.writeFileSync(
      path.join(CORE_ROOT, kebabName, `${kebabName}.controller.ts`),
      controllerContent,
    );

    // 5. Generate Module file
    const moduleContent = generateModuleContent(
      moduleName,
      controllerName,
      serviceName,
      `${kebabName}.controller`,
      `${kebabName}.service`,
    );
    fs.writeFileSync(
      path.join(CORE_ROOT, kebabName, `${kebabName}.module.ts`),
      moduleContent,
    );

    console.log(`✅ ${tableName} module generated successfully!`);
  }
}

void main();
