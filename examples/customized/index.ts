import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'number' })
    userId: number;
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'string' })
    name: number;

    @Column({ type: 'decimal' })
    wage: string;

    @OneToMany(() => Post, (post) => post.userId)
    posts: Post;
}
