'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className='min-h-screen bg-background text-foreground p-6 md:p-12'>
      <div className='max-w-4xl mx-auto'>
        <Link href='/'>
          <Button variant='ghost' size='sm' className='mb-8 flex items-center gap-2'>
            <ArrowLeft className='size-4' />
            Back to Game
          </Button>
        </Link>

        <div className='space-y-12'>
          {/* INFO Section */}
          <section className='space-y-4'>
            <h1 className='text-4xl font-bold italic'>INFO</h1>
            <p className='text-primary/70 text-lg'>
              PlaygroundRL is an interactive reinforcement learning playground where agents explore complex environments
              to discover the most optimal reward.
            </p>
            <Image
              src={'/bunnyupclose.png'}
              width={400}
              height={250}
              className='rounded-lg border mx-auto'
              alt='bunny'
              priority
            />
            <div className='space-y-4 mt-6'>
              <div>
                <h2 className='text-2xl font-bold mb-2'>How do the bunnies even learn?</h2>
                <p className='text-primary/70'>
                  The bunnies use a Policy Gradient method known as Proximal Policy Optimization (PPO). This video
                  <Link
                    className={buttonVariants({ variant: 'link' })}
                    target='_blank'
                    href='https://www.youtube.com/watch?v=8jtAzxUwDj0'
                  >
                    HERE
                  </Link>
                  covers the high level quite nicely. If you want to actually understand it tho read{' '}
                  <Link
                    className={buttonVariants({ variant: 'link' })}
                    href={'https://fse.studenttheses.ub.rug.nl/25709/1/mAI_2021_BickD.pdf'}
                    target='_blank'
                  >
                    THIS
                  </Link>
                </p>
              </div>
            </div>
          </section>

          {/* MODEL DETAILS Section */}
          <section className='space-y-6 border-t pt-12'>
            <h1 className='text-4xl font-bold italic'>MODEL DETAILS</h1>
            <p className='text-primary/70'>
              Reinforcement learning PPO architecture overview, hyperparameters, and training notes.
            </p>

            <div>
              <h3 className='font-bold text-red-500 text-lg pb-2'>Actor-Critic Architecture:</h3>
              <ul className='list-disc ml-6 flex flex-col gap-2 text-primary/70'>
                <li>The agent consists of an actor network (policy) and a critic network (value function)</li>
                <li>The actor generates actions given states, while the critic estimates the value of states</li>
                <li>Both networks are updated during training to improve the policy and value estimates</li>
              </ul>
            </div>

            <div>
              <h3 className='font-bold mt-2 text-purple-500 text-lg pb-2'>Advantage Estimation:</h3>
              <ul className='list-disc ml-6 flex flex-col gap-2 text-primary/70'>
                <li>Advantages are estimated using Generalized Advantage Estimation (GAE)</li>
                <li>GAE balances between bias and variance in the advantage estimates</li>
                <li>
                  The <code>gae_lambda</code> parameter controls the trade-off (0: high bias, 1: high variance)
                </li>
              </ul>
            </div>

            <div>
              <h3 className='font-bold mt-2 text-amber-400 text-lg pb-2'>Minibatch Updates:</h3>
              <ul className='list-disc ml-6 flex flex-col gap-2 text-primary/70'>
                <li>The collected experiences are divided into minibatches for training</li>
                <li>Multiple epochs of updates are performed on each minibatch</li>
                <li>This helps stabilize learning and reduces the variance in gradients</li>
              </ul>
            </div>

            <div>
              <h3 className='font-bold mt-4 text-emerald-500 text-lg pb-2'>Clipped Surrogate Objective:</h3>
              <ul className='list-disc ml-6 flex flex-col gap-2 text-primary/70'>
                <li>The surrogate objective is clipped to constrain policy updates</li>
                <li>Clipping helps prevent large destabilizing updates to the policy</li>
                <li>
                  The <code>clip_coef</code> parameter sets the clipping range (e.g. 0.2 = ±20%)
                </li>
              </ul>
            </div>

            <div>
              <h2 className='font-bold text-lg pb-4 mt-6'>Hyper Parameters:</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 ml-4 text-sm'>
                <p className='text-red-500'>learning_rate: 1e-4</p>
                <p className='text-blue-500'>num_envs: 16</p>
                <p className='text-green-500'>num_steps: 128</p>
                <p className='text-yellow-500'>anneal_lr: True</p>
                <p className='text-indigo-500'>gamma: 0.99</p>
                <p className='text-purple-500'>gae_lambda: 0.95</p>
                <p className='text-pink-500'>num_minibatches: 4</p>
                <p className='text-teal-500'>update_epochs: 4</p>
                <p className='text-red-600'>norm_adv: True</p>
                <p className='text-blue-600'>clip_coef: 0.2</p>
                <p className='text-green-600'>clip_vloss: True</p>
                <p className='text-yellow-600'>ent_coef: 0.02</p>
                <p className='text-indigo-600'>vf_coef: 0.5</p>
                <p className='text-purple-600'>max_grad_norm: 0.5</p>
                <p className='text-pink-600'>total_timesteps: 1,000,000</p>
                <p className='text-amber-400'>batch_size: int(num_envs * num_steps)</p>
                <p className='text-emerald-500'>minibatch_size: int(batch_size // num_minibatches)</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
