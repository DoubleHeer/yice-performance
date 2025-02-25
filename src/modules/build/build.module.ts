import { Module } from '@nestjs/common';
import { BuildController } from './controllers/build.controller';
import { BuildService } from './services/build.service';
import { Build } from './entities/build.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../project/entities/project.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Build, Project])],
    controllers: [BuildController],
    providers: [BuildService],
    exports: [BuildService],
})
export class BuildModule {}
