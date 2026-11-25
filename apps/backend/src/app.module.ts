
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { SitesModule } from './sites/sites.module.js';
import { WarehousesModule } from './warehouses/warehouses.module.js';
import { InventoryLocationsModule } from './inventory-locations/inventory-locations.module.js';
import { MaterialsModule } from './materials/materials.module.js';
import { MaterialCategoriesModule } from './material-categories/material-categories.module.js';
import { MaterialBatchesModule } from './material-batches/material-batches.module.js';
import { InventoryStockModule } from './inventory-stock/inventory-stock.module.js';
import { StockMovementsModule } from './stock-movements/stock-movements.module.js';
import { ProjectAllocationsModule } from './project-allocations/project-allocations.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { MaterialRequestsModule } from './material-requests/material-requests.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CompaniesModule,
    ProjectsModule,
    SitesModule,
    WarehousesModule,
    InventoryLocationsModule,
    MaterialsModule,
    MaterialCategoriesModule,
    MaterialBatchesModule,
    InventoryStockModule,
    StockMovementsModule,
    ProjectAllocationsModule,
    ReservationsModule,
    MaterialRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
