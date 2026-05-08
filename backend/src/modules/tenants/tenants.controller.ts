import { Controller, Post, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

class CriarTenantDto {
  @IsString() nome: string;
  @IsString() slug: string;
  @IsEmail() adminEmail: string;
  @IsString() adminSenha: string;
}

class MpCredenciaisDto {
  @IsString() mpAccessToken: string;
  @IsString() mpPublicKey: string;
  @IsOptional() @IsString() mpWebhookSecret?: string;
}

class InfoDto {
  @IsString() nome: string;
}

class LogoDto {
  @IsOptional() @IsString() logoImage?: string;
}

class PixManualDto {
  @IsOptional() @IsString() chave?: string;
  @IsBoolean() ativo: boolean;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() qrCodeImage?: string;
}

@Controller('tenants')
export class TenantsController {
  constructor(private service: TenantsService) {}

  @Post()
  criar(@Body() dto: CriarTenantDto) {
    return this.service.criar(dto.nome, dto.slug, dto.adminEmail, dto.adminSenha);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    return this.service.buscar(req.user.tenantId);
  }

  @Put('mp-credentials')
  @UseGuards(JwtAuthGuard)
  atualizarMp(@Request() req, @Body() dto: MpCredenciaisDto) {
    return this.service.atualizarCredenciaisMp(
      req.user.tenantId,
      dto.mpAccessToken,
      dto.mpPublicKey,
      dto.mpWebhookSecret,
    );
  }

  @Put('info')
  @UseGuards(JwtAuthGuard)
  atualizarInfo(@Request() req, @Body() dto: InfoDto) {
    return this.service.atualizarInfo(req.user.tenantId, dto.nome);
  }

  @Put('logo')
  @UseGuards(JwtAuthGuard)
  atualizarLogo(@Request() req, @Body() dto: LogoDto) {
    return this.service.atualizarLogo(req.user.tenantId, dto.logoImage || null);
  }

  @Put('pix-manual')
  @UseGuards(JwtAuthGuard)
  atualizarPixManual(@Request() req, @Body() dto: PixManualDto) {
    return this.service.atualizarPixManual(req.user.tenantId, dto.ativo, dto.chave, dto.descricao, dto.qrCodeImage);
  }
}
