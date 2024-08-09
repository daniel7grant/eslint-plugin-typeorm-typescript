import { Entity, Column } from 'typeorm';

@Entity({ name: 'User' })
export class User {
    @Column({ type: 'string' })
    name: number;
}
