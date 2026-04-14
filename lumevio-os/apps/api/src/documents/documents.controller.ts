import { Controller, Get } from "@nestjs/common";

@Controller("documents")
export class DocumentsController {
  @Get()
  findAll() {
    return [];
  }
}
