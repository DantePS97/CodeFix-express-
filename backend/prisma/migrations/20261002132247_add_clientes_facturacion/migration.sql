-- AlterTable
ALTER TABLE `movimientos_inventario` ADD COLUMN `referenciaFacturaId` INTEGER NULL;

-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `identificacion` VARCHAR(30) NULL,
    `contacto` VARCHAR(120) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `clientes_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `numero` INTEGER NOT NULL,
    `clienteId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `impuesto` DECIMAL(12, 2) NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `estado` ENUM('EMITIDA', 'ANULADA') NOT NULL DEFAULT 'EMITIDA',
    `motivoAnulacion` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `facturas_tenantId_idx`(`tenantId`),
    INDEX `facturas_clienteId_idx`(`clienteId`),
    INDEX `facturas_usuarioId_idx`(`usuarioId`),
    UNIQUE INDEX `facturas_tenantId_numero_key`(`tenantId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_factura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facturaId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precioUnitario` DECIMAL(12, 2) NOT NULL,
    `subtotalLinea` DECIMAL(12, 2) NOT NULL,

    INDEX `detalles_factura_facturaId_idx`(`facturaId`),
    INDEX `detalles_factura_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `movimientos_inventario_referenciaFacturaId_idx` ON `movimientos_inventario`(`referenciaFacturaId`);

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_referenciaFacturaId_fkey` FOREIGN KEY (`referenciaFacturaId`) REFERENCES `facturas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Negocio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Negocio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_factura` ADD CONSTRAINT `detalles_factura_facturaId_fkey` FOREIGN KEY (`facturaId`) REFERENCES `facturas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_factura` ADD CONSTRAINT `detalles_factura_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
