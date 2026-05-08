import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

class CriarProdutoDto {
  @IsString() nome: string;
  @IsNumber() preco: number;
  @IsString() categoria: string;
  @IsString() @IsOptional() descricao?: string;
}

class AtualizarProdutoDto {
  @IsString() @IsOptional() nome?: string;
  @IsNumber() @IsOptional() preco?: number;
  @IsString() @IsOptional() categoria?: string;
  @IsString() @IsOptional() descricao?: string;
  @IsBoolean() @IsOptional() ativo?: boolean;
}

@Controller('produtos')
@UseGuards(JwtAuthGuard)
export class ProdutosController {
  constructor(private service: ProdutosService) {}

  @Get()
  listar(@Request() req) {
    return this.service.listar(req.user.tenantId);
  }

  @Get('todos')
  listarTodos(@Request() req) {
    return this.service.listarTodos(req.user.tenantId);
  }

  @Post()
  criar(@Request() req, @Body() dto: CriarProdutoDto) {
    return this.service.criar(req.user.tenantId, dto);
  }

  @Patch(':id')
  atualizar(@Request() req, @Param('id') id: string, @Body() dto: AtualizarProdutoDto) {
    return this.service.atualizar(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  remover(@Request() req, @Param('id') id: string) {
    return this.service.remover(req.user.tenantId, id);
  }
}
