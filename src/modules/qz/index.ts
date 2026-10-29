import { Module } from "@medusajs/framework/utils"
import QzModuleService from "./service"

export const QZ_MODULE = "qz"

export default Module(QZ_MODULE, { service: QzModuleService })
